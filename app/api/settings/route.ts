import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db.from('icp_settings').select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { prompt, mode, score_threshold } = body

  const { data: existing } = await db.from('icp_settings').select('id').single()

  if (existing) {
    const { data, error } = await db
      .from('icp_settings')
      .update({ prompt, mode, score_threshold, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    const { data, error } = await db
      .from('icp_settings')
      .insert({ prompt, mode, score_threshold })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }
}
