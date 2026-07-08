import React from 'react'
import { UserIcon } from '@/components/icons'

export const metadata = {
  title: 'Profile — AI Application Agent',
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <UserIcon size={24} className="text-primary" />
          Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your personal details, professional history, and credentials.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="border border-white/[0.04] bg-white/[0.01] rounded-3xl p-10 text-center backdrop-blur-md">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-500 mb-4">
          <UserIcon size={22} />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">Profile Section Placeholder</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          This area will contain fields for personal profile management, bio, experience level, and billing plan settings.
        </p>
      </div>
    </div>
  )
}
