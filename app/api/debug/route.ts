import { NextResponse } from 'next/server'

export async function GET() {
  const APIFY_API_KEY = process.env.APIFY_API_KEY!
  const actorId = 'harvestapi~linkedin-post-reactions'
  const testUrl = 'https://www.linkedin.com/posts/jonathan-peslar_telling-an-llm-to-act-as-an-expert-is-lazy-activity-7422835993193484288-b6ww'

  // Start run
  const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${APIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ posts: [testUrl], maxItems: 5 }),
  })

  if (!startRes.ok) {
    const text = await startRes.text()
    return NextResponse.json({ error: 'Start failed', status: startRes.status, body: text })
  }

  const startData = await startRes.json()
  const runId = startData.data.id
  const datasetId = startData.data.defaultDatasetId

  // Poll for up to 60s
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
    })
    const statusData = await statusRes.json()
    const status = statusData.data.status

    if (status === 'SUCCEEDED') {
      const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=3`, {
        headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
      })
      const items = await itemsRes.json()
      return NextResponse.json({
        status: 'SUCCEEDED',
        runId,
        datasetId,
        itemCount: Array.isArray(items) ? items.length : '?',
        firstItem: Array.isArray(items) && items.length > 0 ? items[0] : null,
        allItems: items,
      })
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      return NextResponse.json({ error: `Run ended with: ${status}`, runId })
    }
  }

  return NextResponse.json({ error: 'Timed out waiting for run', runId, datasetId })
}
