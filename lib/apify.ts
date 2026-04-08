const APIFY_API_KEY = process.env.APIFY_API_KEY!
const BASE_URL = 'https://api.apify.com/v2'

async function startRun(actorId: string, input: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${APIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify start run failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.data as { id: string; defaultDatasetId: string; status: string }
}

async function waitForRun(runId: string, timeoutMs = 300000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE_URL}/actor-runs/${runId}`, {
      headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
    })
    const data = await res.json()
    const { status, defaultDatasetId } = data.data
    if (status === 'SUCCEEDED') return defaultDatasetId
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${runId} ended with status: ${status}`)
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error(`Apify run ${runId} timed out after ${timeoutMs}ms`)
}

async function getDatasetItems(datasetId: string): Promise<unknown[]> {
  const res = await fetch(
    `${BASE_URL}/datasets/${datasetId}/items?limit=1000`,
    { headers: { Authorization: `Bearer ${APIFY_API_KEY}` } }
  )
  if (!res.ok) throw new Error(`Failed to fetch dataset ${datasetId}`)
  return res.json()
}

export interface ScrapedProfile {
  profileUrl: string
  firstName?: string
  lastName?: string
  fullName?: string
  headline?: string
  sourcePostUrl: string
}

export async function scrapeLinkedInPosts(
  postUrls: string[],
  limitPerSource = 10
): Promise<ScrapedProfile[]> {
  const actorId = process.env.APIFY_POST_SCRAPER_ACTOR!
  const input = {
    deepScrape: true,
    limitPerSource,
    rawData: false,
    urls: postUrls,
  }

  const run = await startRun(actorId, input)
  const datasetId = await waitForRun(run.id)
  const items = await getDatasetItems(datasetId)

  const profiles: ScrapedProfile[] = []

  for (const item of items as Record<string, unknown>[]) {
    const sourceUrl = (item.postUrl as string) || (item.url as string) || ''

    // Extract commenters and likers from the post
    const engagers = extractEngagers(item, sourceUrl)
    profiles.push(...engagers)
  }

  return profiles
}

function extractEngagers(
  item: Record<string, unknown>,
  sourcePostUrl: string
): ScrapedProfile[] {
  const results: ScrapedProfile[] = []

  const addProfile = (p: Record<string, unknown>, source: string) => {
    const url =
      (p.profileUrl as string) ||
      (p.linkedinUrl as string) ||
      (p.url as string) ||
      ''
    if (url && url.includes('linkedin.com')) {
      results.push({
        profileUrl: url,
        firstName: p.firstName as string,
        lastName: p.lastName as string,
        fullName:
          (p.fullName as string) ||
          `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        headline: p.headline as string,
        sourcePostUrl: source,
      })
    }
  }

  // Handle various output structures from the post scraper
  if (Array.isArray(item.comments)) {
    for (const c of item.comments as Record<string, unknown>[]) {
      if (c.author) addProfile(c.author as Record<string, unknown>, sourcePostUrl)
      else addProfile(c, sourcePostUrl)
    }
  }
  if (Array.isArray(item.likes)) {
    for (const l of item.likes as Record<string, unknown>[]) addProfile(l, sourcePostUrl)
  }
  if (Array.isArray(item.reactions)) {
    for (const r of item.reactions as Record<string, unknown>[]) {
      if (r.profile) addProfile(r.profile as Record<string, unknown>, sourcePostUrl)
      else addProfile(r, sourcePostUrl)
    }
  }
  if (Array.isArray(item.engagers)) {
    for (const e of item.engagers as Record<string, unknown>[]) addProfile(e, sourcePostUrl)
  }
  // Some actors return profiles array directly
  if (Array.isArray(item.profiles)) {
    for (const p of item.profiles as Record<string, unknown>[]) addProfile(p, sourcePostUrl)
  }

  return results
}

export async function enrichLinkedInProfiles(
  profileUrls: string[]
): Promise<Record<string, unknown>[]> {
  if (profileUrls.length === 0) return []

  const actorId = process.env.APIFY_PROFILE_ENRICHER_ACTOR!
  const input = { profileUrls }

  const run = await startRun(actorId, input)
  const datasetId = await waitForRun(run.id, 600000) // 10 min timeout for enrichment
  return getDatasetItems(datasetId) as Promise<Record<string, unknown>[]>
}

export function normalizeEnrichedProfile(
  raw: Record<string, unknown>
): Partial<import('../types').Profile> {
  // Normalize fields from dev_fusion/linkedin-profile-scraper output
  const companySize =
    (raw.companySize as string) ||
    (raw.company_size as string) ||
    (raw.employeeCount as string) ||
    null

  const employeeCount = extractEmployeeCount(
    (raw.numEmployees as string | number) ||
    (raw.employeeCount as string | number) ||
    (raw.company_employee_count as string | number) ||
    companySize
  )

  return {
    linkedin_url:
      (raw.profileUrl as string) ||
      (raw.linkedinUrl as string) ||
      (raw.url as string) ||
      '',
    first_name: (raw.firstName as string) || null,
    last_name: (raw.lastName as string) || null,
    full_name:
      (raw.fullName as string) ||
      (raw.name as string) ||
      `${raw.firstName || ''} ${raw.lastName || ''}`.trim() ||
      null,
    headline: (raw.headline as string) || (raw.title as string) || null,
    job_title:
      (raw.jobTitle as string) ||
      (raw.currentTitle as string) ||
      (raw.headline as string) ||
      null,
    seniority: extractSeniority(
      (raw.headline as string) || (raw.jobTitle as string) || ''
    ),
    location:
      (raw.location as string) ||
      (raw.addressWithCountry as string) ||
      null,
    company_name:
      (raw.companyName as string) ||
      (raw.currentCompany as string) ||
      (raw.company as string) ||
      null,
    company_linkedin_url:
      (raw.companyLinkedinUrl as string) ||
      (raw.companyUrl as string) ||
      null,
    company_size: companySize,
    employee_count: employeeCount,
    industry: (raw.industry as string) || null,
    connections:
      typeof raw.connectionsCount === 'number'
        ? raw.connectionsCount
        : typeof raw.connections === 'number'
        ? raw.connections
        : null,
    about: (raw.about as string) || (raw.summary as string) || null,
    profile_image:
      (raw.profilePicture as string) ||
      (raw.profileImage as string) ||
      (raw.photoUrl as string) ||
      null,
    raw_enrichment: raw,
  }
}

function extractEmployeeCount(val: unknown): number | null {
  if (!val) return null
  if (typeof val === 'number') return val
  const str = String(val)
  const match = str.match(/(\d[\d,]*)/)
  if (match) return parseInt(match[1].replace(/,/g, ''))
  return null
}

function extractSeniority(title: string): string | null {
  if (!title) return null
  const lower = title.toLowerCase()
  if (/\b(ceo|cto|cfo|coo|cmo|cso|chief)\b/.test(lower)) return 'C-Suite'
  if (/\bfounder\b/.test(lower)) return 'Founder'
  if (/\bpresident\b/.test(lower)) return 'President'
  if (/\bvp\b|vice president/.test(lower)) return 'VP'
  if (/\bdirector\b/.test(lower)) return 'Director'
  if (/\bmanager\b/.test(lower)) return 'Manager'
  if (/\bsenior\b|\bsr\.?\b/.test(lower)) return 'Senior'
  if (/\blead\b/.test(lower)) return 'Lead'
  return 'Individual Contributor'
}
