import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { name, post_urls } = body

  if (!post_urls || post_urls.length === 0) {
    return NextResponse.json({ error: 'No post URLs provided' }, { status: 400 })
  }

  const { data, error } = await db
    .from('runs')
    .insert({
      name: name || `Run ${new Date().toLocaleDateString()}`,
      post_urls,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
