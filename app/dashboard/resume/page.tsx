import React from 'react'
import { FileTextIcon } from '@/components/icons'

export const metadata = {
  title: 'Resume — AI Application Agent',
}

export default function ResumePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <FileTextIcon size={24} className="text-primary" />
          Resume
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload, manage, and optimize your resume for target positions.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="border border-white/[0.04] bg-white/[0.01] rounded-3xl p-10 text-center backdrop-blur-md">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-500 mb-4">
          <FileTextIcon size={22} />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">Resume Section Placeholder</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          This area will contain resume builder tools, AI optimization suggestions, and version controls.
        </p>
      </div>
    </div>
  )
}
