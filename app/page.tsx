'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Target, TrendingUp, Zap, Play } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Run } from '@/types'

interface Stats {
  totalProfiles: number
  totalRuns: number
  icpMatches: number
  avgScore: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRuns, setRecentRuns] = useState<Run[]>([])

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})

    fetch('/api/runs')
      .then((r) => r.json())
      .then((runs: Run[]) => setRecentRuns(runs.slice(0, 5)))
      .catch(() => {})
  }, [])

  const statCards = [
    {
      label: 'Total Profiles',
      value: stats?.totalProfiles ?? '—',
      icon: Users,
      color: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-400',
    },
    {
      label: 'ICP Matches',
      value: stats?.icpMatches ?? '—',
      icon: Target,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Avg ICP Score',
      value: stats?.avgScore ? `${stats.avgScore}/10` : '—',
      icon: TrendingUp,
      color: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Completed Runs',
      value: stats?.totalRuns ?? '—',
      icon: Zap,
      color: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-400',
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 text-sm">
            LinkedIn intent signals at a glance
          </p>
        </div>
        <Link href="/runs/new" className={cn(buttonVariants(), "bg-violet-600 hover:bg-violet-500 text-white")}>
          <Play className="w-4 h-4 mr-2" />
          New Run
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <Card
            key={label}
            className={`bg-gradient-to-br ${color} border-white/5 p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs font-medium">{label}</p>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Recent Runs
          </h2>
          <Link
            href="/runs"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <Card className="border-white/5 bg-white/[0.02] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Play className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-white/60 text-sm mb-1">No runs yet</p>
            <p className="text-white/30 text-xs mb-4">
              Start by submitting LinkedIn post URLs
            </p>
            <Link href="/runs/new" className={cn(buttonVariants({ size: 'sm' }), "bg-violet-600 hover:bg-violet-500")}>
              Create your first run
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link key={run.id} href={`/runs/${run.id}`}>
                <Card className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(run.status) }} />
                    <div>
                      <p className="text-sm font-medium text-white">{run.name}</p>
                      <p className="text-xs text-white/40">
                        {run.total_profiles} profiles · {new Date(run.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} />
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: '#22c55e',
    failed: '#ef4444',
    scraping: '#f59e0b',
    enriching: '#3b82f6',
    evaluating: '#8b5cf6',
    pending: '#6b7280',
  }
  return colors[status] || '#6b7280'
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    scraping: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    enriching: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    evaluating: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return (
    <Badge
      variant="outline"
      className={`text-[10px] capitalize border ${styles[status] || styles.pending}`}
    >
      {status}
    </Badge>
  )
}
