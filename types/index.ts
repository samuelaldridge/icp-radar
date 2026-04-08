export type RunStatus =
  | 'pending'
  | 'scraping'
  | 'enriching'
  | 'evaluating'
  | 'completed'
  | 'failed'

export type ICPMode = 'scoring' | 'criteria'

export interface Run {
  id: string
  name: string
  status: RunStatus
  post_urls: string[]
  limit_per_source: number
  total_posts: number
  total_profiles: number
  evaluated_profiles: number
  created_at: string
  completed_at: string | null
  error: string | null
}

export interface Profile {
  id: string
  linkedin_url: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  headline: string | null
  location: string | null
  company_name: string | null
  company_linkedin_url: string | null
  company_size: string | null
  employee_count: number | null
  industry: string | null
  connections: number | null
  about: string | null
  job_title: string | null
  seniority: string | null
  profile_image: string | null
  is_fortune_500: boolean
  raw_enrichment: Record<string, unknown> | null
  created_at: string
  appearance_count?: number
}

export interface RunProfile {
  id: string
  run_id: string
  profile_id: string
  source_post_url: string
  created_at: string
  profile?: Profile
}

export interface ICPEvaluation {
  id: string
  profile_id: string
  run_id: string
  score: number
  is_icp: boolean
  reasoning: string
  strengths: string[]
  weaknesses: string[]
  evaluated_at: string
  profile?: Profile
}

export interface ICPSettings {
  id: string
  prompt: string
  mode: ICPMode
  score_threshold: number
  updated_at: string
}

export interface AnalyticsData {
  totalProfiles: number
  totalRuns: number
  icpMatches: number
  avgScore: number
  repeatProfiles: RepeatProfile[]
  companyGroups: CompanyGroup[]
  companySizeBreakdown: CompanySizeGroup[]
  fortune500Count: number
  csuiteProfiles: Profile[]
}

export interface RepeatProfile {
  profile: Profile
  appearance_count: number
  run_count: number
}

export interface CompanyGroup {
  company_name: string
  company_linkedin_url: string | null
  profile_count: number
  icp_count: number
  is_fortune_500: boolean
  profiles: Profile[]
}

export interface CompanySizeGroup {
  bucket: string
  count: number
  icp_count: number
}
