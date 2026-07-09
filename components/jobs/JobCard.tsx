'use client'

import React, { useState } from 'react'
import type { JobRow } from '@/types/job'

interface JobCardProps {
  job: JobRow
  onSaveToggle: (id: string, newStatus: boolean) => Promise<void>
}

// Platform badge colors
const PLATFORM_STYLES: Record<string, { bg: string; text: string }> = {
  greenhouse: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  lever:      { bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700'  },
  workable:   { bg: 'bg-sky-50 border-sky-200',        text: 'text-sky-700'     },
  wellfound:  { bg: 'bg-orange-50 border-orange-200',  text: 'text-orange-700'  },
}

// Score color bands
function scoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-primary'
  if (score >= 55) return 'bg-amber-400'
  return 'bg-zinc-300'
}

function scoreTextColor(score: number) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-primary'
  if (score >= 55) return 'text-amber-500'
  return 'text-zinc-400'
}

// Company initials avatar
function CompanyAvatar({ company, logo }: { company: string | null, logo?: string | null }) {
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={`${company} logo`} 
        className="w-11 h-11 rounded-xl object-contain bg-white border border-zinc-100 flex-shrink-0" 
      />
    )
  }

  const letters = (company ?? 'J')
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')
    || '?'

  const hue = Math.abs(
    [...(company ?? '')].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % 360

  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none"
      style={{ background: `hsl(${hue}, 55%, 42%)` }}
      aria-hidden
    >
      {letters}
    </div>
  )
}

// Bookmark icon
const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
  </svg>
)

// Map icon
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z" />
    <circle cx="12" cy="8" r="2" />
  </svg>
)

// Dollar icon
const DollarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export default function JobCard({ job, onSaveToggle }: JobCardProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(job.saved_status)

  const platformStyle = PLATFORM_STYLES[job.platform] ?? {
    bg: 'bg-zinc-50 border-zinc-200',
    text: 'text-zinc-600',
  }

  async function handleSave() {
    setSaving(true)
    const next = !saved
    setSaved(next) // optimistic
    try {
      await onSaveToggle(job.id, next)
    } catch {
      setSaved(!next) // revert on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="group relative bg-white border border-zinc-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 rounded-2xl p-5 transition-all duration-200">
      {/* Top row: avatar + title area + platform badge */}
      <div className="flex items-start gap-4">
        <CompanyAvatar company={job.company} logo={job.company_logo} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 leading-snug truncate pr-2">
                {job.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                {job.company ?? 'Unknown Company'}
              </p>
            </div>

            {/* Platform badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full flex-shrink-0 ${platformStyle.bg} ${platformStyle.text}`}>
              {job.platform.charAt(0).toUpperCase() + job.platform.slice(1)}
            </span>
          </div>

          {/* Meta row: location, salary */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon />
                {job.location}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center gap-1">
                <DollarIcon />
                {job.salary}
              </span>
            )}
            {job.job_type && (
              <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
                {job.job_type}
              </span>
            )}
            {job.experience_level && (
              <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
                {job.experience_level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <p className="mt-3 text-[12px] text-zinc-600 leading-relaxed line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Skills */}
      {job.tags && job.tags.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold bg-primary/8 text-primary border border-primary/20 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Match score + direct URL + actions row */}
      <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-zinc-100">
        {/* Match score + apply URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">AI Match</span>
            <span className={`text-[11px] font-bold ${scoreTextColor(job.match_score)}`}>
              {job.match_score}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreColor(job.match_score)}`}
              style={{ width: `${job.match_score}%` }}
            />
          </div>
          {/* Direct apply URL — visible so users know exactly where they're going */}
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-400 hover:text-primary transition-colors truncate max-w-[260px]"
              title={job.job_url}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 9a4 4 0 0 0 5.66 0l1.42-1.42a4 4 0 0 0-5.66-5.66L7 3.34" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7a4 4 0 0 0-5.66 0L1.92 8.42a4 4 0 0 0 5.66 5.66L9 12.66" />
              </svg>
              <span className="truncate">{job.job_url}</span>
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              h-8 w-8 rounded-xl border flex items-center justify-center transition-all duration-150 cursor-pointer
              ${saved
                ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600'
              }
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={saved ? 'Unsave job' : 'Save job'}
            title={saved ? 'Saved' : 'Save'}
          >
            <BookmarkIcon filled={saved} />
          </button>

          {/* Apply Now — direct link to application form */}
          {job.job_url ? (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-4 rounded-xl bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm hover:shadow-primary/20 hover:shadow-md"
              aria-label={`Apply to ${job.title} at ${job.company}`}
              title={job.job_url}
            >
              Apply Now
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
          ) : (
            <button
              disabled
              className="h-8 px-4 rounded-xl bg-zinc-100 text-zinc-400 text-[11px] font-bold flex items-center justify-center cursor-not-allowed"
            >
              No URL
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
