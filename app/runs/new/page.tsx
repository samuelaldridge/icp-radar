'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Link2, ArrowRight, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function NewRunPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pastedUrls, setPastedUrls] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [singleUrl, setSingleUrl] = useState('')
  const [limitPerSource, setLimitPerSource] = useState(10)
  const [loading, setLoading] = useState(false)

  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.includes('linkedin.com'))
  }

  const handlePasteConfirm = () => {
    const parsed = parseUrls(pastedUrls)
    if (parsed.length === 0) {
      toast.error('No valid LinkedIn URLs found')
      return
    }
    setUrls((prev) => [...new Set([...prev, ...parsed])])
    setPastedUrls('')
    toast.success(`Added ${parsed.length} URL${parsed.length !== 1 ? 's' : ''}`)
  }

  const handleAddSingle = () => {
    if (!singleUrl.includes('linkedin.com')) {
      toast.error('Please enter a valid LinkedIn URL')
      return
    }
    setUrls((prev) => [...new Set([...prev, singleUrl.trim()])])
    setSingleUrl('')
  }

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseUrls(text)
      setUrls((prev) => [...new Set([...prev, ...parsed])])
      toast.success(`Loaded ${parsed.length} URL${parsed.length !== 1 ? 's' : ''} from CSV`)
    }
    reader.readAsText(file)
  }

  const removeUrl = (url: string) => {
    setUrls((prev) => prev.filter((u) => u !== url))
  }

  const handleSubmit = async () => {
    if (urls.length === 0) {
      toast.error('Add at least one LinkedIn post URL')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `Run — ${new Date().toLocaleDateString()}`,
          post_urls: urls,
          limit_per_source: limitPerSource,
        }),
      })

      if (!res.ok) throw new Error('Failed to create run')
      const run = await res.json()

      toast.success('Run created! Starting scrape...')

      // Kick off scraping — enrich and evaluate chain automatically server-side
      fetch(`/api/runs/${run.id}/scrape`, { method: 'POST' }).catch(() => {})

      router.push(`/runs/${run.id}`)
    } catch {
      toast.error('Failed to create run')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">New Run</h1>
        <p className="text-white/40 text-sm">
          Add LinkedIn post URLs — we&apos;ll scrape commenters, enrich profiles, and evaluate ICP fit
        </p>
      </div>

      {/* Run Name */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-4">
        <Label className="text-white/60 text-xs mb-2 block">Run Name (optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Run — ${new Date().toLocaleDateString()}`}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
        />
      </Card>

      {/* Scrape Limit */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label className="text-white/60 text-xs block mb-0.5">Profiles per Post</Label>
            <p className="text-white/25 text-xs">Max LinkedIn profiles to scrape from each post</p>
          </div>
          <span className="text-2xl font-bold text-white w-12 text-right">{limitPerSource}</span>
        </div>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={limitPerSource}
          onChange={(e) => setLimitPerSource(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/20">5</span>
          <span className="text-[10px] text-white/20">500</span>
        </div>
        {urls.length > 0 && (
          <p className="text-xs text-white/30 mt-2">
            Up to <span className="text-violet-300">{urls.length * limitPerSource}</span> total profiles across {urls.length} post{urls.length !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

      {/* URL Input */}
      <Card className="border-white/5 bg-white/[0.02] p-5 mb-4">
        <Tabs defaultValue="paste">
          <TabsList className="bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="paste" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Paste URLs
            </TabsTrigger>
            <TabsTrigger value="single" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              Add One
            </TabsTrigger>
            <TabsTrigger value="csv" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste">
            <Textarea
              value={pastedUrls}
              onChange={(e) => setPastedUrls(e.target.value)}
              placeholder="Paste LinkedIn post URLs, one per line or comma-separated&#10;&#10;https://www.linkedin.com/posts/...&#10;https://www.linkedin.com/posts/..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-xs min-h-[140px] resize-none"
            />
            <Button
              onClick={handlePasteConfirm}
              className="mt-3 bg-violet-600 hover:bg-violet-500 text-white"
              disabled={!pastedUrls.trim()}
            >
              Add URLs
            </Button>
          </TabsContent>

          <TabsContent value="single">
            <div className="flex gap-2">
              <Input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
              />
              <Button onClick={handleAddSingle} className="bg-violet-600 hover:bg-violet-500 text-white">
                Add
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="csv">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-violet-500/50 transition-colors">
              <Upload className="w-6 h-6 text-white/30 mb-2" />
              <p className="text-white/40 text-sm">Click to upload CSV file</p>
              <p className="text-white/20 text-xs mt-1">URLs will be extracted automatically</p>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
            </label>
          </TabsContent>
        </Tabs>
      </Card>

      {/* URL List */}
      {urls.length > 0 && (
        <Card className="border-white/5 bg-white/[0.02] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-white/60">
              {urls.length} URL{urls.length !== 1 ? 's' : ''} queued
            </p>
            <button
              onClick={() => setUrls([])}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {urls.map((url) => (
              <div
                key={url}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] group"
              >
                <Link2 className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <p className="text-xs text-white/60 truncate flex-1 font-mono">{url}</p>
                <button
                  onClick={() => removeUrl(url)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white/30 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          The full pipeline runs automatically after submission
        </p>
        <Button
          onClick={handleSubmit}
          disabled={loading || urls.length === 0}
          className="bg-violet-600 hover:bg-violet-500 text-white min-w-[140px]"
        >
          {loading ? 'Creating...' : 'Start Run'}
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}
