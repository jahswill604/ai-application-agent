import React from 'react'
import { ExtractedProfile } from '@/types/profile'

interface ProfileCompletenessCardProps {
  profile: ExtractedProfile
}

/**
 * Displays a profile strength card with an overall completeness score and section breakdowns.
 *
 * @param p - The extracted profile used to calculate the displayed scores.
 * @returns The rendered profile completeness card.
 */
export default function ProfileCompletenessCard({ profile: p }: ProfileCompletenessCardProps) {
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
    { label: 'Personal info', score: calcPersonal(), icon: '👤' },
    { label: 'Summary', score: calcSummary(), icon: '📝' },
    { label: 'Skills', score: calcSkills(), icon: '⚡' },
    { label: 'Experience', score: calcExp(), icon: '💼' },
    { label: 'Education', score: calcEdu(), icon: '🎓' },
    { label: 'Projects', score: calcProj(), icon: '🚀' },
    { label: 'Certifications', score: calcCert(), icon: '🏆' },
  ]

  const totalScore = Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length)
  const isStrong = totalScore >= 80

  const size = 140
  const strokeWidth = 11
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (totalScore / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-400'
    if (score >= 50) return 'bg-amber-400'
    return 'bg-rose-400'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      {/* Gradient Header Band */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      <div className="p-6 flex flex-col gap-5">
        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest">Profile Strength</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalScore === 100
              ? 'Your profile is complete!'
              : 'Complete your profile to stand out'}
          </p>
        </div>

        {/* Circular Progress */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              className="-rotate-90"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#progressGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900">{totalScore}</span>
              <span className="text-sm font-bold text-gray-400 -mt-1">%</span>
            </div>
          </div>

          {isStrong ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Strong Profile
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Needs Attention
            </span>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* Section Scores */}
        <div className="space-y-3">
          {scores.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${
                  item.score >= 80 ? 'text-emerald-500' :
                  item.score >= 50 ? 'text-amber-500' : 'text-rose-400'
                }`}>{item.score}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
