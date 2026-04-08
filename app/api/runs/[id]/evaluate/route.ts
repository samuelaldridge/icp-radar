import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { evaluateProfile } from '@/lib/anthropic'
import type { Profile, ICPSettings } from '@/types'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  // Get ICP settings
  const { data: settings } = await db
    .from('icp_settings')
    .select('*')
    .single()

  if (!settings) {
    return NextResponse.json({ error: 'ICP settings not found' }, { status: 500 })
  }

  // Get all profiles for this run
  const { data: runProfiles, error } = await db
    .from('run_profiles')
    .select('profile_id, profile:profiles(*)')
    .eq('run_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profiles = (runProfiles || [])
    .map((rp) => rp.profile as unknown as Profile)
    .filter(Boolean)

  // Check which profiles already have evaluations
  const { data: existingEvals } = await db
    .from('icp_evaluations')
    .select('profile_id')
    .eq('run_id', id)

  const evaluatedIds = new Set((existingEvals || []).map((e) => e.profile_id))
  const toEvaluate = profiles.filter((p) => !evaluatedIds.has(p.id))

  let evaluated = 0
  const errors: string[] = []

  for (const profile of toEvaluate) {
    try {
      const result = await evaluateProfile(profile, settings as ICPSettings)

      await db.from('icp_evaluations').upsert(
        {
          profile_id: profile.id,
          run_id: id,
          score: result.score,
          is_icp: result.is_icp,
          reasoning: result.reasoning,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          evaluated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,run_id' }
      )

      evaluated++

      // Update progress
      await db
        .from('runs')
        .update({ evaluated_profiles: evaluated + existingEvals!.length })
        .eq('id', id)

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      errors.push(
        `Profile ${profile.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  // Mark run as completed
  await db.from('runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({
    success: true,
    evaluated,
    errors: errors.length > 0 ? errors : undefined,
  })
}
