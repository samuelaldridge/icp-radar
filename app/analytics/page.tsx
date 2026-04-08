'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, TrendingUp, Building2, Users, Star, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AnalyticsData } from '@/types'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
          </div>
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-white/40 text-sm">Aggregated insights across all runs</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Profiles', value: data.totalProfiles, icon: Users, color: 'text-violet-400', bg: 'from-violet-500/20 to-violet-500/5' },
          { label: 'ICP Matches', value: data.icpMatches, icon: Star, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Fortune 500', value: data.fortune500Count, icon: Award, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5' },
          { label: 'Avg ICP Score', value: data.avgScore ? `${data.avgScore}/10` : '—', icon: TrendingUp, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={`bg-gradient-to-br ${bg} border-white/5 p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs font-medium">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="repeat">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="repeat" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
            Repeat Profiles
          </TabsTrigger>
          <TabsTrigger value="companies" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
            Company Groups
          </TabsTrigger>
          <TabsTrigger value="sizes" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
            Company Size
          </TabsTrigger>
          <TabsTrigger value="csuite" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">
            C-Suite / Directors
          </TabsTrigger>
        </TabsList>

        {/* Repeat Profiles */}
        <TabsContent value="repeat">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <p className="text-sm text-white/60">Profiles appearing across multiple runs — high intent signals</p>
          </div>
          {data.repeatProfiles.length === 0 ? (
            <EmptyState message="No repeat profiles yet. Run more scrapes to see intent patterns." />
          ) : (
            <div className="space-y-2">
              {data.repeatProfiles.map(({ profile, appearance_count }) => (
                <Card key={profile.id} className="border-white/5 bg-white/[0.02] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-violet-300">{appearance_count}×</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white">{profile.full_name || 'Unknown'}</p>
                      {profile.is_fortune_500 && <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">F500</Badge>}
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {profile.job_title || profile.headline} · {profile.company_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white/30">
                      {appearance_count} run{appearance_count !== 1 ? 's' : ''}
                    </p>
                    {profile.seniority && (
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white/30 mt-1">{profile.seniority}</Badge>
                    )}
                  </div>
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 text-white/20 hover:text-blue-400 transition-colors" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Company Groups */}
        <TabsContent value="companies">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-white/60">Multiple contacts from the same company — account-level intent</p>
          </div>
          {data.companyGroups.length === 0 ? (
            <EmptyState message="No company groups yet. Multiple profiles from the same company will appear here." />
          ) : (
            <div className="space-y-2">
              {data.companyGroups.map((group) => (
                <Card key={group.company_name} className="border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-white">{group.company_name}</p>
                        {group.is_fortune_500 && (
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">F500</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {group.profile_count} profile{group.profile_count !== 1 ? 's' : ''} · {group.icp_count} ICP match{group.icp_count !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{group.profile_count}</p>
                        <p className="text-[10px] text-white/30">contacts</p>
                      </div>
                      {group.icp_count > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-400">{group.icp_count}</p>
                          <p className="text-[10px] text-white/30">ICPs</p>
                        </div>
                      )}
                      {group.company_linkedin_url && (
                        <a href={group.company_linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-white/20 hover:text-blue-400 transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* People at company */}
                  <div className="mt-3 pl-14 flex flex-wrap gap-1.5">
                    {group.profiles.slice(0, 5).map((p) => (
                      <span key={p.id} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/40">
                        {p.full_name || 'Unknown'} · {p.seniority || p.job_title || '—'}
                      </span>
                    ))}
                    {group.profiles.length > 5 && (
                      <span className="text-[10px] text-white/25">+{group.profiles.length - 5} more</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Company Size */}
        <TabsContent value="sizes">
          <div className="mb-3">
            <p className="text-sm text-white/60">Profile and ICP distribution by company size</p>
          </div>
          {data.companySizeBreakdown.length === 0 ? (
            <EmptyState message="No company size data yet." />
          ) : (
            <div className="space-y-3">
              {data.companySizeBreakdown.map(({ bucket, count, icp_count }) => {
                const pct = data.totalProfiles > 0 ? (count / data.totalProfiles) * 100 : 0
                const icpPct = count > 0 ? (icp_count / count) * 100 : 0
                return (
                  <Card key={bucket} className="border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{bucket} employees</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">{count} profiles</span>
                        <span className="text-xs text-emerald-400">{icp_count} ICP</span>
                      </div>
                    </div>
                    {/* Total bar */}
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-violet-500/50 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* ICP bar */}
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/60 rounded-full"
                        style={{ width: `${icpPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/20">{pct.toFixed(0)}% of all profiles</span>
                      <span className="text-[10px] text-white/20">{icpPct.toFixed(0)}% ICP rate</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* C-Suite / Directors */}
        <TabsContent value="csuite">
          <div className="mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <p className="text-sm text-white/60">C-Suite, Founders, VPs, and Directors from 100+ employee companies</p>
          </div>
          {data.csuiteProfiles.length === 0 ? (
            <EmptyState message="No senior profiles from 100+ employee companies found yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.csuiteProfiles.map((profile) => (
                <Card key={profile.id} className="border-white/5 bg-white/[0.02] p-4 border-l-2 border-l-amber-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-medium text-white truncate">{profile.full_name || 'Unknown'}</p>
                        {profile.is_fortune_500 && (
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] flex-shrink-0">F500</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50 truncate">{profile.job_title || profile.headline}</p>
                      <p className="text-xs text-white/30 truncate">{profile.company_name}</p>
                      {profile.employee_count && (
                        <p className="text-[10px] text-white/20 mt-0.5">{profile.employee_count.toLocaleString()} employees</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-400">{profile.seniority}</Badge>
                      {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-white/20 hover:text-blue-400 transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-white/5 bg-white/[0.02] p-12 text-center">
      <p className="text-white/30 text-sm">{message}</p>
    </Card>
  )
}
