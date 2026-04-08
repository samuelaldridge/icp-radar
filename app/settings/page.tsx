'use client'

import { useEffect, useState } from 'react'
import { Save, Sparkles, Target, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { ICPSettings } from '@/types'

const EXAMPLE_PROMPTS = [
  {
    label: 'SaaS Sales Tool',
    prompt: `Our ICP is a sales leader or revenue operations professional at a B2B SaaS company with 50-500 employees. They are responsible for managing a sales team of 5+ reps and are actively looking to improve pipeline efficiency. Key signals: VP of Sales, Sales Director, Head of RevOps, or SDR Manager titles. Company must be in tech/SaaS industry. Bonus points for companies that have recently raised funding or are scaling their sales team.`,
  },
  {
    label: 'HR Tech Platform',
    prompt: `Our ICP is an HR leader at a mid-market company (100-2000 employees) in any industry. They are responsible for talent acquisition, employee experience, or people operations. Key titles: CHRO, VP of People, Head of HR, Talent Acquisition Manager, or People Operations Director. We prioritize companies undergoing rapid growth or digital transformation.`,
  },
  {
    label: 'Marketing Agency',
    prompt: `Our ICP is a marketing decision-maker at a B2B company with 20-500 employees who controls a marketing budget. Key titles: CMO, VP of Marketing, Marketing Director, Head of Growth, or Demand Generation Manager. Ideal companies are in professional services, SaaS, or e-commerce. We prioritize companies that are actively investing in content, paid media, or brand awareness.`,
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<ICPSettings | null>(null)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'scoring' | 'criteria'>('scoring')
  const [threshold, setThreshold] = useState(7)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s: ICPSettings) => {
        setSettings(s)
        setPrompt(s.prompt || '')
        setMode(s.mode || 'scoring')
        setThreshold(s.score_threshold || 7)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, score_threshold: threshold }),
      })
      if (!res.ok) throw new Error()
      toast.success('ICP settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">ICP Settings</h1>
        <p className="text-white/40 text-sm">
          Define your Ideal Customer Profile — Claude will use this to evaluate every profile
        </p>
      </div>

      {/* Mode Toggle */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-4">
        <Label className="text-white/60 text-xs mb-3 block">Evaluation Mode</Label>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'scoring' | 'criteria')}>
          <TabsList className="bg-white/5 border border-white/10 w-full">
            <TabsTrigger
              value="scoring"
              className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50"
            >
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Score All (1–10)
            </TabsTrigger>
            <TabsTrigger
              value="criteria"
              className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Criteria Match (Yes/No)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="mt-4">
            <div className="flex items-start gap-2 text-xs text-white/40 bg-white/[0.03] rounded-lg p-3">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-violet-400" />
              <p>
                Claude scores every profile 1–10 based on your ICP prompt. All profiles are saved.
                You can filter by score threshold in the Profiles and Runs views.
              </p>
            </div>
            <div className="mt-4">
              <Label className="text-white/60 text-xs mb-2 block">
                ICP Match Threshold (profiles at or above this score are marked as ICP)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-white font-bold w-8 text-center">{threshold}</span>
              </div>
              <p className="text-xs text-white/25 mt-1">
                Profiles scoring {threshold}+ will be marked as ICP matches
              </p>
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="mt-4">
            <div className="flex items-start gap-2 text-xs text-white/40 bg-white/[0.03] rounded-lg p-3">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
              <p>
                Claude evaluates each profile against your criteria and returns a binary Yes/No match,
                plus a score for ranking. Define clear criteria in your prompt below.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* ICP Prompt */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-white/60 text-xs">ICP Prompt</Label>
          <Select onValueChange={(val) => {
            const example = EXAMPLE_PROMPTS.find((e) => e.label === val)
            if (example) setPrompt(example.prompt)
          }}>
            <SelectTrigger className="w-44 h-7 text-xs bg-white/5 border-white/10 text-white/50">
              <SelectValue placeholder="Load example..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              {EXAMPLE_PROMPTS.map((e) => (
                <SelectItem key={e.label} value={e.label} className="text-white/70 text-xs">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your Ideal Customer Profile in detail. Include:&#10;• Target job titles and seniority levels&#10;• Company size range (employees)&#10;• Industry or vertical&#10;• Key signals or triggers&#10;• Any disqualifying criteria&#10;&#10;The more specific you are, the better Claude's evaluations will be."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[240px] resize-none text-sm leading-relaxed"
        />
        <p className="text-xs text-white/25 mt-2">
          {prompt.length} characters · Claude uses this prompt to evaluate every profile, one at a time
        </p>
      </Card>

      {/* Tips */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-6">
        <p className="text-xs font-medium text-white/50 mb-3">Tips for a great ICP prompt</p>
        <ul className="space-y-2">
          {[
            'Be specific about seniority — "VP or above" is clearer than "senior leader"',
            'Include company size ranges — this is often the strongest signal',
            'List industries you target AND industries you avoid',
            'Mention intent signals — "actively hiring", "recently funded", "scaling sales team"',
            'For criteria mode: phrase requirements as clear conditions Claude can check',
          ].map((tip, i) => (
            <li key={i} className="text-xs text-white/40 flex items-start gap-2">
              <span className="text-violet-400 flex-shrink-0 mt-0.5">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 text-white min-w-[120px]"
        >
          <Save className="w-3.5 h-3.5 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {settings?.updated_at && (
        <p className="text-xs text-white/20 text-right mt-2">
          Last saved {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
