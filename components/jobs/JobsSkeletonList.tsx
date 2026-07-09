import React from 'react'

function SkeletonCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 animate-pulse">
      {/* Top row */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-zinc-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-zinc-200 rounded-md w-48" />
            <div className="h-4 bg-zinc-100 rounded-full w-20" />
          </div>
          <div className="h-3 bg-zinc-100 rounded-md w-28" />
          <div className="flex gap-2 mt-1">
            <div className="h-3 bg-zinc-100 rounded-full w-16" />
            <div className="h-3 bg-zinc-100 rounded-full w-20" />
            <div className="h-3 bg-zinc-100 rounded-full w-16" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-3 space-y-1.5">
        <div className="h-3 bg-zinc-100 rounded-md w-full" />
        <div className="h-3 bg-zinc-100 rounded-md w-5/6" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 mt-3">
        {[40, 56, 48, 36].map(w => (
          <div key={w} className="h-4 bg-zinc-100 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-zinc-100">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 bg-zinc-100 rounded w-16" />
            <div className="h-2.5 bg-zinc-100 rounded w-8" />
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full w-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-zinc-100 rounded-xl" />
          <div className="h-8 w-24 bg-zinc-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function JobsSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
