'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import type { Run } from '@/types'

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/runs')
      .then((r) => r.json())
      .then(setRuns)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Runs</h1>
          <p className="text-white/40 text-sm">
            {runs.length} total run{runs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/runs/new" className={cn(buttonVariants(), "bg-violet-600 hover:bg-violet-500 text-white")}>
          <Plus className="w-4 h-4 mr-2" />
          New Run
        </Link>
      </div>

      {runs.length === 0 ? (
        <Card className="border-white/5 bg-white/[0.02] p-16 text-center">
          <p className="text-white/40 mb-4">No runs yet. Start scraping!</p>
          <Link href="/runs/new" className={cn(buttonVariants(), "bg-violet-600 hover:bg-violet-500")}>
            Create First Run
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} onDelete={async (id) => {
              const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' })
              if (res.ok) {
                setRuns((prev) => prev.filter((r) => r.id !== id))
                toast.success('Run deleted')
              } else {
                toast.error('Failed to delete run')
              }
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function RunCard({ run, onDelete }: { run: Run; onDelete: (id: string) => void }) {
  const progress = run.total_profiles > 0
    ? Math.round((run.evaluated_profiles / run.total_profiles) * 100)
    : 0

  const statusStyles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    scraping: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    enriching: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    evaluating: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }

  return (
    <Card className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <Link href={`/runs/${run.id}`} className="font-semibold text-white hover:text-violet-300 transition-colors">
              {run.name}
            </Link>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize border ${statusStyles[run.status] || statusStyles.pending}`}
            >
              {run.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
            <span>{run.post_urls.length} posts</span>
            <span>{run.total_profiles} profiles</span>
            <span>{run.evaluated_profiles} evaluated</span>
            <span>{new Date(run.created_at).toLocaleDateString()}</span>
          </div>

          {['evaluating', 'enriching', 'scraping'].includes(run.status) && (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1 flex-1 bg-white/10" />
              <span className="text-xs text-white/30">{progress}%</span>
            </div>
          )}

          {run.error && (
            <p className="text-xs text-red-400 mt-1">{run.error}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white/20 hover:text-red-400 hover:bg-red-400/10"
            onClick={() => onDelete(run.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Link href={`/runs/${run.id}`}>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-white/30 hover:text-white">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
