import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getCompanySizeBucket } from '@/lib/fortune500'
import type { Profile } from '@/types'

export async function GET() {
  const db = createServiceClient()

  // All profiles with evaluation data
  const { data: profiles } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // All evaluations
  const { data: evaluations } = await db
    .from('icp_evaluations')
    .select('*, profile:profiles(*)')

  // Run profiles for appearance counting
  const { data: runProfiles } = await db
    .from('run_profiles')
    .select('profile_id, run_id')

  const { data: runs } = await db.from('runs').select('id, status')

  const allProfiles = (profiles || []) as Profile[]
  const allEvals = evaluations || []
  const allRunProfiles = runProfiles || []

  // 1. Repeat profiles (appearing in multiple runs)
  const profileRunCount = new Map<string, Set<string>>()
  for (const rp of allRunProfiles) {
    if (!profileRunCount.has(rp.profile_id)) {
      profileRunCount.set(rp.profile_id, new Set())
    }
    profileRunCount.get(rp.profile_id)!.add(rp.run_id)
  }

  const repeatProfiles = allProfiles
    .filter((p) => (profileRunCount.get(p.id)?.size || 0) > 1)
    .map((p) => ({
      profile: p,
      appearance_count: profileRunCount.get(p.id)?.size || 1,
      run_count: profileRunCount.get(p.id)?.size || 1,
    }))
    .sort((a, b) => b.appearance_count - a.appearance_count)

  // 2. Company groups (multiple ICPs from same company)
  const companyMap = new Map<
    string,
    { profiles: Profile[]; icp_count: number; is_fortune_500: boolean; company_linkedin_url: string | null }
  >()

  for (const profile of allProfiles) {
    const company = profile.company_name || 'Unknown'
    if (!companyMap.has(company)) {
      companyMap.set(company, {
        profiles: [],
        icp_count: 0,
        is_fortune_500: profile.is_fortune_500,
        company_linkedin_url: profile.company_linkedin_url,
      })
    }
    const group = companyMap.get(company)!
    group.profiles.push(profile)

    const eval_ = allEvals.find((e) => e.profile_id === profile.id)
    if (eval_?.is_icp) group.icp_count++
  }

  const companyGroups = Array.from(companyMap.entries())
    .filter(([, g]) => g.profiles.length > 1)
    .map(([company_name, g]) => ({
      company_name,
      company_linkedin_url: g.company_linkedin_url,
      profile_count: g.profiles.length,
      icp_count: g.icp_count,
      is_fortune_500: g.is_fortune_500,
      profiles: g.profiles,
    }))
    .sort((a, b) => b.profile_count - a.profile_count)

  // 3. Company size breakdown
  const sizeBuckets = new Map<string, { count: number; icp_count: number }>()
  for (const profile of allProfiles) {
    const bucket = getCompanySizeBucket(profile.employee_count)
    if (!sizeBuckets.has(bucket)) sizeBuckets.set(bucket, { count: 0, icp_count: 0 })
    const b = sizeBuckets.get(bucket)!
    b.count++
    const eval_ = allEvals.find((e) => e.profile_id === profile.id)
    if (eval_?.is_icp) b.icp_count++
  }

  const bucketOrder = ['1–10', '11–50', '51–200', '201–1,000', '1,000+', 'Unknown']
  const companySizeBreakdown = bucketOrder
    .filter((b) => sizeBuckets.has(b))
    .map((b) => ({ bucket: b, ...sizeBuckets.get(b)! }))

  // 4. Fortune 500 count
  const fortune500Count = allProfiles.filter((p) => p.is_fortune_500).length

  // 5. C-Suite / Director from 100+ employee companies
  const csuiteProfiles = allProfiles.filter((p) => {
    const isSenior = ['C-Suite', 'Founder', 'President', 'VP', 'Director'].includes(
      p.seniority || ''
    )
    const is100Plus = (p.employee_count || 0) >= 100
    return isSenior && is100Plus
  })

  // Summary stats
  const totalProfiles = allProfiles.length
  const totalRuns = (runs || []).filter((r) => r.status === 'completed').length
  const icpMatches = allEvals.filter((e) => e.is_icp).length
  const scores = allEvals.map((e) => e.score).filter(Boolean)
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

  return NextResponse.json({
    totalProfiles,
    totalRuns,
    icpMatches,
    avgScore,
    repeatProfiles,
    companyGroups,
    companySizeBreakdown,
    fortune500Count,
    csuiteProfiles,
  })
}
