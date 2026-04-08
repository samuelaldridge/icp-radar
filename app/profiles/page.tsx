'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Search, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProfileWithEval {
  id: string
  linkedin_url: string
  full_name: string | null
  job_title: string | null
  headline: string | null
  company_name: string | null
  company_size: string | null
  employee_count: number | null
  seniority: string | null
  location: string | null
  industry: string | null
  is_fortune_500: boolean
  profile_image: string | null
  icp_evaluations: Array<{
    score: number
    is_icp: boolean
    reasoning: string
    run_id: string
  }>
}

interface Run {
  id: string
  name: string
  status: string
  created_at: string
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileWithEval[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState('1')
  const [icpOnly, setIcpOnly] = useState(false)
  const [fortune500Only, setFortune500Only] = useState(false)
  const [seniority, setSeniority] = useState('all')
  const [runId, setRunId] = useState('all')

  useEffect(() => {
    fetch('/api/runs').then((r) => r.json()).then(setRuns).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (minScore !== '1') params.set('minScore', minScore)
    if (icpOnly) params.set('icpOnly', 'true')
    if (fortune500Only) params.set('fortune500', 'true')
    if (seniority !== 'all') params.set('seniority', seniority)
    if (runId !== 'all') params.set('runId', runId)

    setLoading(true)
    fetch(`/api/profiles?${params}`)
      .then((r) => r.json())
      .then(setProfiles)
      .finally(() => setLoading(false))
  }, [minScore, icpOnly, fortune500Only, seniority, runId])

  const filtered = profiles.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.job_title?.toLowerCase().includes(q) ||
      p.headline?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Profiles</h1>
        <p className="text-white/40 text-sm">{profiles.length} total profiles</p>
      </div>

      {/* Filters */}
      <Card className="border-white/5 bg-white/[0.02] p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, title..."
              className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
            />
          </div>

          <Select value={minScore} onValueChange={(v) => setMinScore(v ?? '1')}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Min Score" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-white/70">
                  Score {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={seniority} onValueChange={(v) => setSeniority(v ?? 'all')}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all" className="text-white/70">All Seniority</SelectItem>
              {['C-Suite', 'Founder', 'President', 'VP', 'Director', 'Manager', 'Senior', 'Lead'].map((s) => (
                <SelectItem key={s} value={s} className="text-white/70">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={runId} onValueChange={(v) => setRunId(v ?? 'all')}>
            <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="All Runs" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all" className="text-white/70">All Runs</SelectItem>
              {runs.filter(r => r.status === 'completed').map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-white/70">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIcpOnly(!icpOnly)}
            className={`border text-sm ${icpOnly ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/50'}`}
          >
            <Filter className="w-3 h-3 mr-1.5" />
            ICP Only
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFortune500Only(!fortune500Only)}
            className={`border text-sm ${fortune500Only ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-white/10 text-white/50'}`}
          >
            Fortune 500
          </Button>
        </div>
      </Card>

      {/* Profile Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-white/5 bg-white/[0.02] p-16 text-center">
          <p className="text-white/40">No profiles match your filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileCard({ profile }: { profile: ProfileWithEval }) {
  const latestEval = profile.icp_evaluations?.[0]
  const score = latestEval?.score
  const isIcp = latestEval?.is_icp

  const scoreColor =
    !score ? 'text-white/30' :
    score >= 8 ? 'text-emerald-400' :
    score >= 6 ? 'text-amber-400' :
    score >= 4 ? 'text-orange-400' : 'text-red-400'

  const initials = [
    profile.full_name?.split(' ')[0]?.[0],
    profile.full_name?.split(' ')[1]?.[0],
  ].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <Card className={`border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors ${isIcp ? 'border-l-2 border-l-emerald-500/40' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-white/60">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-white truncate">
              {profile.full_name || 'Unknown'}
            </p>
            {isIcp && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] flex-shrink-0">ICP</Badge>
            )}
          </div>
          <p className="text-xs text-white/40 truncate">
            {profile.job_title || profile.headline || 'No title'}
          </p>
        </div>

        {score !== undefined && (
          <div className="flex-shrink-0 text-right">
            <p className={`text-lg font-bold ${scoreColor}`}>{score}</p>
            <p className="text-[9px] text-white/25">/10</p>
          </div>
        )}
      </div>

      <div className="space-y-1 mb-3">
        {profile.company_name && (
          <p className="text-xs text-white/50">
            <span className="text-white/25">Company: </span>
            {profile.company_name}
            {profile.is_fortune_500 && (
              <span className="ml-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1 py-0.5">F500</span>
            )}
          </p>
        )}
        {profile.employee_count && (
          <p className="text-xs text-white/50">
            <span className="text-white/25">Size: </span>
            {profile.employee_count.toLocaleString()} employees
          </p>
        )}
        {profile.seniority && (
          <p className="text-xs text-white/50">
            <span className="text-white/25">Level: </span>
            {profile.seniority}
          </p>
        )}
        {profile.location && (
          <p className="text-xs text-white/40 truncate">{profile.location}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex gap-1.5">
          {profile.seniority && (
            <Badge variant="outline" className="text-[9px] border-white/10 text-white/30">
              {profile.seniority}
            </Badge>
          )}
          {profile.industry && (
            <Badge variant="outline" className="text-[9px] border-white/10 text-white/30 max-w-[100px] truncate">
              {profile.industry}
            </Badge>
          )}
        </div>
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="w-6 h-6 text-white/20 hover:text-blue-400">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}
