import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { enrichLinkedInProfiles, normalizeEnrichedProfile } from '@/lib/apify'
import { isFortune500 } from '@/lib/fortune500'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  // Get all profiles for this run that need enrichment
  const { data: runProfiles, error } = await db
    .from('run_profiles')
    .select('profile_id, profile:profiles(id, linkedin_url, raw_enrichment)')
    .eq('run_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Only enrich profiles that haven't been enriched yet
  const toEnrich = (runProfiles || [])
    .filter((rp) => {
      const profile = rp.profile as unknown as { raw_enrichment: unknown } | null
      return profile && !profile.raw_enrichment
    })
    .map((rp) => {
      const profile = rp.profile as unknown as { id: string; linkedin_url: string }
      return { id: profile.id, linkedin_url: profile.linkedin_url }
    })

  if (toEnrich.length === 0) {
    await db.from('runs').update({ status: 'evaluating' }).eq('id', id)
    return NextResponse.json({ success: true, enriched: 0 })
  }

  try {
    const profileUrls = toEnrich.map((p) => p.linkedin_url)
    const enriched = await enrichLinkedInProfiles(profileUrls)

    // Match enriched data back to profiles by URL
    const urlToEnriched = new Map<string, Record<string, unknown>>()
    for (const item of enriched as Record<string, unknown>[]) {
      const url =
        (item.profileUrl as string) ||
        (item.linkedinUrl as string) ||
        (item.url as string)
      if (url) urlToEnriched.set(url, item)
    }

    for (const profile of toEnrich) {
      const raw = urlToEnriched.get(profile.linkedin_url)
      if (!raw) continue

      const normalized = normalizeEnrichedProfile(raw)
      normalized.is_fortune_500 = isFortune500(normalized.company_name || null)

      await db
        .from('profiles')
        .update({ ...normalized, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
    }

    await db.from('runs').update({ status: 'evaluating' }).eq('id', id)

    return NextResponse.json({ success: true, enriched: toEnrich.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await db.from('runs').update({ status: 'failed', error: message }).eq('id', id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
