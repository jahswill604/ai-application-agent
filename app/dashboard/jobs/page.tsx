'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLATFORMS } from '@/types/job'
import type { JobRow, JobPlatform, JobsApiResponse } from '@/types/job'
import type { ProfileRow } from '@/types/profile'

import PlatformCard from '@/components/jobs/PlatformCard'
import JobCard from '@/components/jobs/JobCard'
import JobsSkeletonList from '@/components/jobs/JobsSkeletonList'
import JobsSidebar from '@/components/jobs/JobsSidebar'

// ─── Icons ───────────────────────────────────────────────────────────────────

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 6h10M3 11h18M12 11v6" />
  </svg>
)

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`w-4 h-4 transition-transform ${spinning ? 'animate-spin' : ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
  </svg>
)

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = name?.split(' ')[0] ?? 'there'
  return `${time}, ${firstName}!`
}

function formatCacheTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  return `${Math.floor(diff / 60)}h ago`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Partial<ProfileRow> | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<JobPlatform>>(
    new Set(['greenhouse', 'lever', 'workable', 'wellfound'])
  )
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<JobPlatform | 'all'>('all')
  const [sortBy, setSortBy] = useState<'match' | 'recent'>('match')

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    loadProfile()
  }, [])

  // ── Fetch jobs ────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (forceRefresh = false) => {
    if (selectedPlatforms.size === 0) {
      setJobs([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        platforms: Array.from(selectedPlatforms).join(','),
        ...(forceRefresh ? { refresh: '1' } : {}),
      })

      const res = await fetch(`/api/jobs?${params}`, { credentials: 'same-origin' })
      const data: JobsApiResponse = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? `Error ${res.status}`)
        setJobs([])
      } else {
        setJobs(data.jobs)
        setFromCache(data.fromCache)
        setFetchedAt(data.fetchedAt)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [selectedPlatforms])

  // Auto-fetch when platforms change
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // ── Platform toggle ───────────────────────────────────────────────────────
  function togglePlatform(id: string) {
    const pid = id as JobPlatform
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(pid)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(pid)
      } else {
        next.add(pid)
      }
      return next
    })
  }

  // ── Save toggle ───────────────────────────────────────────────────────────
  async function handleSaveToggle(id: string, newStatus: boolean) {
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, saved_status: newStatus }),
    })
    setJobs(prev => prev.map(j => j.id === id ? { ...j, saved_status: newStatus } : j))
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const displayedJobs = jobs
    .filter(j => filterPlatform === 'all' || j.platform === filterPlatform)
    .sort((a, b) =>
      sortBy === 'match'
        ? b.match_score - a.match_score
        : new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
    )

  const savedJobs = jobs.filter(j => j.saved_status)
  const platformCounts = PLATFORMS.reduce<Record<string, number>>((acc, p) => {
    acc[p.id] = jobs.filter(j => j.platform === p.id).length
    return acc
  }, {})

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <SparklesIcon />
                AI AGENT ACTIVE
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">
              Welcome back, {profile?.full_name ? profile.full_name.split(' ')[0].toUpperCase() : 'USER'}!
            </h1>
            <p className="text-sm text-zinc-500">
              We've found 0 new job matches for you today.
            </p>
          </div>
        </div>
        <button className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
          View Analytics
        </button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Jobs</h1>
          <p className="text-zinc-500 mt-1">Find your next opportunity with AI-powered job matching.</p>
        </div>
        <button
          onClick={() => fetchJobs(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshIcon spinning={loading} />
          {loading ? 'Refreshing...' : 'Refresh Search'}
        </button>
      </div>


      {/* ── Main Grid: Job list + Sidebar ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-5 min-w-0">

          {/* Platform Selector Cards */}
          <section>
            <h2 className="text-base font-bold text-zinc-900 mb-3">
              Job Platforms
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map(p => (
                <PlatformCard
                  key={p.id}
                  platform={p}
                  jobCount={platformCounts[p.id] ?? 0}
                  isSelected={selectedPlatforms.has(p.id)}
                  isLoading={loading}
                  onToggle={togglePlatform}
                />
              ))}
            </div>
          </section>

          {/* Toolbar: filters + sort */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              Top Job Matches
            </h2>
            <div className="relative w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
          </div>

          {/* ── Results ────────────────────────────────────────────────────── */}

          {/* Loading skeleton */}
          {loading && <JobsSkeletonList count={4} />}

          {/* Error state */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-500">
                <AlertIcon />
              </div>
              <h3 className="text-sm font-bold text-red-700 mb-1">Could not fetch jobs</h3>
              <p className="text-xs text-red-500 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => fetchJobs(true)}
                className="mt-4 px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayedJobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <BriefcaseIcon />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">No jobs found</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                We couldn't find any jobs matching your profile on the selected platforms. Try updating your profile or modifying filters.
              </p>
            </div>
          )}

          {/* Job cards */}
          {!loading && !error && displayedJobs.length > 0 && (
            <section>
              <div className="grid grid-cols-1 gap-4">
                {displayedJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <JobsSidebar
          profile={profile}
          savedJobs={savedJobs}
          recentJobs={jobs.slice(0, 5)}
        />
      </div>
    </div>
  )
}
