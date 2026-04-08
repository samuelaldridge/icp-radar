import Anthropic from '@anthropic-ai/sdk'
import type { Profile, ICPSettings } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface EvaluationResult {
  score: number
  is_icp: boolean
  reasoning: string
  strengths: string[]
  weaknesses: string[]
}

export async function evaluateProfile(
  profile: Profile,
  settings: ICPSettings
): Promise<EvaluationResult> {
  const profileSummary = buildProfileSummary(profile)

  const systemPrompt = `You are an expert B2B sales analyst evaluating LinkedIn profiles to determine if they match an Ideal Customer Profile (ICP).

Your task:
1. Score the profile 1-10 (10 = perfect ICP match)
2. Determine if this is an ICP match (yes/no) based on the criteria
3. Provide clear reasoning
4. List 2-3 strengths and 2-3 weaknesses

ICP Definition:
${settings.prompt || 'No ICP prompt defined. Score based on general B2B sales potential.'}

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 1-10>,
  "is_icp": <true or false>,
  "reasoning": "<2-3 sentence explanation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"]
}`

  const userMessage = `Evaluate this LinkedIn profile:

${profileSummary}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    return {
      score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
      is_icp: Boolean(parsed.is_icp),
      reasoning: parsed.reasoning || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    }
  } catch {
    // Fallback: extract JSON from response if wrapped in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
        is_icp: Boolean(parsed.is_icp),
        reasoning: parsed.reasoning || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      }
    }
    throw new Error(`Failed to parse AI response: ${text}`)
  }
}

function buildProfileSummary(profile: Profile): string {
  const lines = [
    `Name: ${profile.full_name || 'Unknown'}`,
    `Title: ${profile.job_title || profile.headline || 'Unknown'}`,
    `Seniority: ${profile.seniority || 'Unknown'}`,
    `Company: ${profile.company_name || 'Unknown'}`,
    `Company Size: ${profile.company_size || (profile.employee_count ? `~${profile.employee_count} employees` : 'Unknown')}`,
    `Industry: ${profile.industry || 'Unknown'}`,
    `Location: ${profile.location || 'Unknown'}`,
    `Connections: ${profile.connections || 'Unknown'}`,
    `Fortune 500: ${profile.is_fortune_500 ? 'Yes' : 'No'}`,
  ]

  if (profile.about) {
    lines.push(`About: ${profile.about.slice(0, 500)}`)
  }

  return lines.join('\n')
}
