import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { scrapeLinkedInPosts } from '@/lib/apify'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  // Get the run
  const { data: run, error: runError } = await db
    .from('runs')
    .select('*')
    .eq('id', id)
    .single()

  if (runError) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

  // Update status to scraping
  await db.from('runs').update({ status: 'scraping' }).eq('id', id)

  try {
    const profiles = await scrapeLinkedInPosts(run.post_urls, run.limit_per_source || 10)

    // Deduplicate by profileUrl
    const seen = new Set<string>()
    const uniqueProfiles = profiles.filter((p) => {
      if (!p.profileUrl || seen.has(p.profileUrl)) return false
      seen.add(p.profileUrl)
      return true
    })

    // Upsert profiles into DB
    for (const scraped of uniqueProfiles) {
      const { data: profile } = await db
        .from('profiles')
        .upsert(
          {
            linkedin_url: scraped.profileUrl,
            full_name: scraped.fullName,
            first_name: scraped.firstName,
            last_name: scraped.lastName,
            headline: scraped.headline,
            job_title: scraped.headline,
            profile_image: scraped.profileImage || null,
          },
          { onConflict: 'linkedin_url', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (profile) {
        await db.from('run_profiles').upsert(
          {
            run_id: id,
            profile_id: profile.id,
            source_post_url: scraped.sourcePostUrl,
          },
          { onConflict: 'run_id,profile_id,source_post_url', ignoreDuplicates: true }
        )
      }
    }

    await db.from('runs').update({
      status: 'scraped',
      total_posts: run.post_urls.length,
      total_profiles: uniqueProfiles.length,
    }).eq('id', id)

    return NextResponse.json({
      success: true,
      profilesFound: uniqueProfiles.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await db.from('runs').update({ status: 'failed', error: message }).eq('id', id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
