import React from 'react'
import { ListChecksIcon } from '@/components/icons'

export const metadata = {
  title: 'Applications — AI Application Agent',
}

/**
 * Renders the Applications page with a status header and placeholder content.
 */
export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <ListChecksIcon size={24} className="text-primary" />
          Application Status
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Track current status, progress, and upcoming interview dates for your applications.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="border border-zinc-200 bg-zinc-50/50 rounded-3xl p-10 text-center backdrop-blur-md">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-550 mb-4">
          <ListChecksIcon size={22} />
        </div>
        <h3 className="text-base font-semibold text-zinc-800">Application Status Placeholder</h3>
        <p className="text-xs text-zinc-550 mt-1 max-w-xs mx-auto">
          This area will display an interactive Kanban tracking board or table showing sent applications, follow-ups, and calendar alerts.
        </p>
      </div>
    </div>
  )
}
