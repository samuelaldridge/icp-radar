'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Users, Target, Star, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Run, ICPEvaluation } from '@/types'

interface RunProfile {
  id: string
  profile: unknown
}

interface RunDetail {
  run: Run
  runProfiles: RunProfile[]
  evaluations: ICPEvaluation[]
}

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<RunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [minScore, setMinScore] = useState(1)
  const [icpOnly, setIcpOnly] = useState(false)

  const fetchData = () => {
    fetch(`/api/runs/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // Poll if run is in progress
    const interval = setInterval(() => {
      if (data?.run.status && !['completed', 'failed'].includes(data.run.status)) {
        fetchData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [id, data?.run.status])

  const handleRerun = async (step: 'scrape' | 'enrich' | 'evaluate') => {
    toast.loading(`Starting ${step}...`)
    const res = await fetch(`/api/runs/${id}/${step}`, { method: 'POST' })
    toast.dismiss()
    if (res.ok) {
      toast.success(`${step} started`)
      fetchData()
    } else {
      toast.error(`Failed to start ${step}`)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-white/40">Run not found</div>

  const { run, evaluations = [] } = data

  const filtered = evaluations
    .filter((e) => e.score >= minScore)
    .filter((e) => !icpOnly || e.is_icp)

  const progress = run.total_profiles > 0
    ? Math.round((run.evaluated_profiles / run.total_profiles) * 100)
    : 0

  const statusStyles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    scraping: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    scraped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    enriching: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    evaluating: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/runs">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white w-8 h-8 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{run.name}</h1>
            <Badge variant="outline" className={`text-[10px] capitalize border ${statusStyles[run.status]}`}>
              {run.status}
            </Badge>
          </div>
          <p className="text-white/40 text-sm">
            Created {new Date(run.created_at).toLocaleString()}
            {run.completed_at && ` · Completed ${new Date(run.completed_at).toLocaleString()}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {run.status === 'scraped' && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleRerun('enrich')}>
              Enrich Profiles
            </Button>
          )}
          {run.status === 'failed' && (
            <>
              <Button size="sm" variant="outline" className="border-white/10 text-white/60 hover:text-white" onClick={() => handleRerun('scrape')}>
                Retry Scrape
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 text-white/60 hover:text-white" onClick={() => handleRerun('enrich')}>
                Retry Enrich
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="text-white/40 hover:text-white" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Posts Scraped', value: run.total_posts, icon: Target },
          { label: 'Profiles Found', value: run.total_profiles, icon: Users },
          { label: 'Evaluated', value: run.evaluated_profiles, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
            <Icon className="w-4 h-4 text-violet-400" />
            <div>
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Progress */}
      {!['completed', 'failed', 'pending', 'scraped'].includes(run.status) && (
        <Card className="border-white/5 bg-white/[0.02] p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60 capitalize">{run.status}...</p>
            <p className="text-xs text-white/30">{progress}%</p>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/10" />
        </Card>
      )}

      {run.error && (
        <Card className="border-red-500/20 bg-red-500/5 p-4 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{run.error}</p>
        </Card>
      )}

      {/* Source Posts */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-6">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Source Posts</p>
        <div className="space-y-1.5">
          {run.post_urls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-violet-300 transition-colors font-mono"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{url}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Scraped profiles — shown before enrichment */}
      {run.status === 'scraped' && data.runProfiles && data.runProfiles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Scraped Profiles</h2>
              <p className="text-xs text-white/30 mt-0.5">{data.runProfiles.length} profiles ready to enrich</p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleRerun('enrich')}>
              Enrich All Profiles
            </Button>
          </div>
          <div className="space-y-2">
            {data.runProfiles.map((rp) => {
              const profile = rp.profile as { id: string; full_name: string | null; headline: string | null; linkedin_url: string; profile_image: string | null } | null
              if (!profile) return null
              return (
                <Card key={rp.id} className="border-white/5 bg-white/[0.02] p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profile.profile_image
                      ? <img src={profile.profile_image} alt="" className="w-8 h-8 object-cover" />
                      : <span className="text-xs text-white/40">{profile.full_name?.[0] || '?'}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{profile.full_name || 'Unknown'}</p>
                    <p className="text-xs text-white/40 truncate">{profile.headline || 'No headline'}</p>
                  </div>
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 hover:text-blue-400 transition-colors" />
                  </a>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Evaluations */}
      {evaluations.length > 0 && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Evaluations
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={icpOnly}
                  onChange={(e) => setIcpOnly(e.target.checked)}
                  className="rounded"
                />
                ICP only
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Min score:</span>
                <select
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>{n}+</option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-white/30">{filtered.length} shown</span>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {filtered.map((eval_) => (
                <EvalCard key={eval_.id} evaluation={eval_} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function EvalCard({ evaluation }: { evaluation: ICPEvaluation }) {
  const [expanded, setExpanded] = useState(false)
  const profile = evaluation.profile
  const score = evaluation.score

  const scoreColor =
    score >= 8 ? 'text-emerald-400' :
    score >= 6 ? 'text-amber-400' :
    score >= 4 ? 'text-orange-400' : 'text-red-400'

  const scoreBg =
    score >= 8 ? 'bg-emerald-500/10 border-emerald-500/20' :
    score >= 6 ? 'bg-amber-500/10 border-amber-500/20' :
    score >= 4 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <Card className={`border-white/5 bg-white/[0.02] p-4 transition-all ${evaluation.is_icp ? 'border-l-2 border-l-emerald-500/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Score */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg border ${scoreBg} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'Unknown'}
              </p>
              {evaluation.is_icp && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] border">
                  ICP
                </Badge>
              )}
              {profile?.is_fortune_500 && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] border">
                  F500
                </Badge>
              )}
            </div>
            <p className="text-xs text-white/40 truncate">
              {profile?.job_title || profile?.headline || 'No title'} · {profile?.company_name || 'No company'}
            </p>
            {profile?.employee_count && (
              <p className="text-xs text-white/25">{profile.employee_count.toLocaleString()} employees</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {profile?.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="w-7 h-7 text-white/20 hover:text-blue-400">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-white/20 hover:text-white"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4">
          <Separator className="mb-4 bg-white/5" />
          <p className="text-xs text-white/60 mb-3 leading-relaxed">{evaluation.reasoning}</p>

          <div className="grid grid-cols-2 gap-3">
            {evaluation.strengths?.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-emerald-400 mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.weaknesses?.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-red-400 mb-1.5">Weaknesses</p>
                <ul className="space-y-1">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">−</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
