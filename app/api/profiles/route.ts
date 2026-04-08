import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const minScore = searchParams.get('minScore')
  const icpOnly = searchParams.get('icpOnly') === 'true'
  const seniority = searchParams.get('seniority')
  const fortune500 = searchParams.get('fortune500') === 'true'
  const runId = searchParams.get('runId')

  let query = db
    .from('profiles')
    .select(`
      *,
      icp_evaluations(score, is_icp, reasoning, strengths, weaknesses, run_id)
    `)
    .order('created_at', { ascending: false })

  if (fortune500) query = query.eq('is_fortune_500', true)
  if (seniority) query = query.eq('seniority', seniority)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let profiles = data || []

  // Filter by run if specified
  if (runId) {
    const { data: rp } = await db
      .from('run_profiles')
      .select('profile_id')
      .eq('run_id', runId)
    const ids = new Set((rp || []).map((r) => r.profile_id))
    profiles = profiles.filter((p) => ids.has(p.id))
  }

  // Filter by score/ICP
  if (minScore) {
    const min = parseInt(minScore)
    profiles = profiles.filter((p) => {
      const evals = (p.icp_evaluations as { score: number }[]) || []
      return evals.some((e) => e.score >= min)
    })
  }

  if (icpOnly) {
    profiles = profiles.filter((p) => {
      const evals = (p.icp_evaluations as { is_icp: boolean }[]) || []
      return evals.some((e) => e.is_icp)
    })
  }

  return NextResponse.json(profiles)
}
