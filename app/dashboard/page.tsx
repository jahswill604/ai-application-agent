import React from 'react'
import { FolderIcon } from '@/components/icons'

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] border border-white/[0.04] bg-white/[0.01] rounded-3xl p-8 text-center backdrop-blur-md">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-primary mb-6 shadow-inner animate-pulse">
        <FolderIcon size={32} />
      </div>
      <h2 className="text-xl font-bold text-zinc-200 mb-2">Main Content Area</h2>
      <p className="text-sm text-zinc-500 max-w-sm">
        Keep blank for now — pages will render here later based on navigation.
      </p>
    </div>
  )
}
