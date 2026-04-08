import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  const { data: run, error } = await db
    .from('runs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: runProfiles } = await db
    .from('run_profiles')
    .select('*, profile:profiles(*)')
    .eq('run_id', id)

  const { data: evaluations } = await db
    .from('icp_evaluations')
    .select('*, profile:profiles(*)')
    .eq('run_id', id)
    .order('score', { ascending: false })

  return NextResponse.json({ run, runProfiles, evaluations })
}
