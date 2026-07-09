import React from 'react'
import { SparklesIcon } from '@/components/icons'

interface SidebarBrandProps {
  isCollapsed?: boolean
}

/**
 * Renders the sidebar brand header.
 *
 * @param isCollapsed - Controls the compact sidebar layout and desktop text visibility.
 */
export default function SidebarBrand({ isCollapsed = false }: SidebarBrandProps) {
  return (
    <div
      className={`flex items-center border-b border-white/[0.08] transition-all duration-300 ${
        isCollapsed ? 'justify-between md:justify-center py-6 px-6 md:px-0' : 'gap-3 px-6 py-6'
      }`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 flex-shrink-0">
        <SparklesIcon size={20} />
      </div>
      
      {/* Text brand name is always visible on mobile, responsive on desktop */}
      <div className={`transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
        <h1 className="text-base font-bold tracking-tight text-white leading-none">
          AI Application Agent
        </h1>
        <span className="text-[11px] text-primary font-medium tracking-wider uppercase">
          App Shell v1.0
        </span>
      </div>
    </div>
  )
}
