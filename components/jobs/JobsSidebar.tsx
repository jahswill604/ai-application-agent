'use client'

import React from 'react'
import type { ProfileRow } from '@/types/profile'
import type { JobRow } from '@/types/job'

interface JobsSidebarProps {
  profile: Partial<ProfileRow> | null
  savedJobs: JobRow[]
  recentJobs: JobRow[]
}

export function computeProfileStrength(p: Partial<ProfileRow> | null) {
  if (!p) return { totalScore: 0, scores: [] }

  const calcPersonal = () => {
    let s = 0
    if (p.full_name) s++
    if (p.email) s++
    if (p.phone) s++
    if (p.location) s++
    if (p.headline) s++
    if (p.contact_details?.linkedin) s++
    if (p.contact_details?.github) s++
    if (p.contact_details?.website) s++
    return Math.round((s / 8) * 100)
  }

  const calcSummary = () => (p.summary ? 100 : 0)
  const calcSkills = () => Math.min(Math.round(((p.skills?.length || 0) / 5) * 100), 100)
  const calcExp = () => {
    if (!p.work_experience || p.work_experience.length === 0) return 0
    let s = 0
    const max = p.work_experience.length * 5
    p.work_experience.forEach(w => {
      if (w.company) s++
      if (w.title) s++
      if (w.start) s++
      if (w.end) s++
      if (w.description) s++
    })
    return Math.round((s / max) * 100)
  }
  const calcEdu = () => {
    if (!p.education || p.education.length === 0) return 0
    let s = 0
    const max = p.education.length * 5
    p.education.forEach(e => {
      if (e.school) s++
      if (e.degree) s++
      if (e.field) s++
      if (e.start) s++
      if (e.end) s++
    })
    return Math.round((s / max) * 100)
  }
  const calcProj = () => {
    if (!p.projects || p.projects.length === 0) return 0
    let s = 0
    const max = p.projects.length * 2
    p.projects.forEach(pr => {
      if (pr.name) s++
      if (pr.description) s++
    })
    return Math.round((s / max) * 100)
  }
  const calcCert = () => Math.min(Math.round(((p.certifications?.length || 0) / 2) * 100), 100)

  const scores = [
    { label: 'Basic Information', score: calcPersonal() },
    { label: 'Summary', score: calcSummary() },
    { label: 'Skills', score: calcSkills() },
    { label: 'Work Experience', score: calcExp() },
    { label: 'Education', score: calcEdu() },
  ]
  
  // To match ProfileCompletenessCard we also calculate Proj and Cert, 
  // but for the UI checklist we mainly show the primary ones + Resume.
  const allScores = [
    ...scores,
    { label: 'Projects', score: calcProj() },
    { label: 'Certifications', score: calcCert() },
  ]

  const totalScore = Math.round(allScores.reduce((acc, curr) => acc + curr.score, 0) / allScores.length)

  return { totalScore, scores }
}

function completenessColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-primary'
  if (pct >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

function completenessLabel(pct: number) {
  if (pct >= 90) return 'Excellent'
  if (pct >= 70) return 'Good'
  if (pct >= 50) return 'Fair'
  return 'Needs work'
}

// Relative time formatter
function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const PLATFORM_DOTS: Record<string, string> = {
  greenhouse: 'bg-emerald-500',
  lever:      'bg-indigo-500',
  workable:   'bg-sky-500',
  wellfound:  'bg-orange-500',
}

export default function JobsSidebar({ profile, savedJobs, recentJobs }: JobsSidebarProps) {
  const { totalScore: completeness, scores } = computeProfileStrength(profile)
  const checklistItems = [
    ...scores,
    { label: 'Resume', score: profile?.resume_uploaded ? 100 : 0 }
  ]

  // Combine saved + recent, dedupe, take top 5
  const activityJobs = Array.from(
    new Map([...savedJobs, ...recentJobs].map(j => [j.id, j])).values()
  ).slice(0, 5)

  return (
    <aside className="flex flex-col gap-4">
      {/* ── Profile Completeness ───────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <h3 className="text-base font-bold text-zinc-900 mb-6">
          Profile Completeness
        </h3>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f4f4f5" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke={completeness >= 80 ? '#10b981' : completeness >= 60 ? '#8dc615' : completeness >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - completeness / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className={`text-xl font-bold ${completeness >= 80 ? 'text-[#10b981]' : completeness >= 60 ? 'text-[#8dc615]' : completeness >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}
              >
                {completeness}%
              </span>
              <span className="text-[10px] text-zinc-500">Complete</span>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-zinc-900">{completeness >= 80 ? 'Great job! 🎊' : 'Keep going! 🚀'}</p>
            <p className="text-sm text-zinc-500 mt-1 leading-snug">
              {completeness >= 80 ? 'Your profile looks\nstrong.' : 'Complete fields\nto boost matches.'}
            </p>
          </div>
        </div>

        {/* List of fields */}
        <div className="space-y-4 mt-8">
          {checklistItems.map(f => {
            const isMissing = f.score < 100
            return (
              <div key={f.label} className="flex items-center gap-3">
                {!isMissing ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-500 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-500 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                <span className="text-sm font-semibold text-zinc-700">{f.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h3>

        {activityJobs.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-zinc-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            </div>
            <p className="text-xs text-zinc-400">No activity yet</p>
            <p className="text-[11px] text-zinc-300 mt-0.5">Save or apply to jobs to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityJobs.map(job => (
              <div key={job.id} className="flex items-start gap-3">
                {/* Platform dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PLATFORM_DOTS[job.platform] ?? 'bg-zinc-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{job.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{job.company}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {job.saved_status && (
                      <span className="text-[10px] font-bold text-amber-500">Saved</span>
                    )}
                    {job.applied_status && (
                      <span className="text-[10px] font-bold text-emerald-500">Applied</span>
                    )}
                    <span className="text-[10px] text-zinc-300">{timeAgo(job.fetched_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Tips ──────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
          💡 Pro Tips
        </h3>
        <ul className="space-y-2">
          {[
            'Select multiple platforms to compare job counts',
            'Jobs refresh automatically every 6 hours',
            'Save jobs to track them in Recent Activity',
            'Higher match % = more of your skills matched',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-600">
              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
