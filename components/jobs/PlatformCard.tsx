'use client'

import React from 'react'
import Image from 'next/image'
import type { PlatformMeta } from '@/types/job'

interface PlatformCardProps {
  platform: PlatformMeta
  jobCount: number
  isSelected: boolean
  isLoading: boolean
  onToggle: (id: string) => void
}

// Logo images for platforms
const PlatformGlyph = ({ id }: { id: string }) => {
  const imagePaths: Record<string, string> = {
    greenhouse: '/platform/greenhouse.png',
    lever: '/platform/lever.jfif',
    workable: '/platform/workable.png',
    wellfound: '/platform/wellfound.png'
  }
  
  const imagePath = imagePaths[id]

  if (imagePath) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative bg-white border border-zinc-100 flex items-center justify-center p-1">
        <Image src={imagePath} alt={id} fill className="object-contain p-1" sizes="40px" />
      </div>
    )
  }

  // Fallback for missing images
  return (
    <div className="w-10 h-10 rounded-lg bg-[#bbf7d0] flex flex-shrink-0 items-center justify-center font-bold text-zinc-900 text-sm">
      {id.substring(0, 2).toUpperCase()}
    </div>
  )
}

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-500">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function PlatformCard({
  platform,
  jobCount,
  isSelected,
  isLoading,
  onToggle,
}: PlatformCardProps) {
  return (
    <button
      onClick={() => onToggle(platform.id)}
      disabled={isLoading}
      className={`
        relative flex items-center gap-3 p-4 rounded-xl border-2 text-left
        transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-[#84cc16] bg-[#84cc16]/5'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
        }
        ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      aria-pressed={isSelected}
      aria-label={`Toggle ${platform.name}`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full">
          <CheckCircleIcon />
        </div>
      )}

      <PlatformGlyph id={platform.id} />

      <div className="flex-1">
        <p className="text-sm font-bold text-zinc-900 leading-tight">{platform.name}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Job Board</p>
      </div>
    </button>
  )
}
