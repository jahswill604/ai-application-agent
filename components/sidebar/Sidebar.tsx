'use client'

import React, { useState } from 'react'
import SidebarBrand from './SidebarBrand'
import SidebarNav from './SidebarNav'
import SidebarFooter from './SidebarFooter'
import {
  MenuIcon,
  XIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons'

interface SidebarProps {
  userEmail: string
  profileName?: string
  avatarUrl?: string
  credits?: {
    remaining: number
    max: number
  }
}

export default function Sidebar({
  userEmail,
  profileName,
  avatarUrl,
  credits,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-zinc-950 border-b border-white/[0.08] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <SparklesIcon size={16} />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            AI Application Agent
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon size={20} />
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-45 transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container - Solid bg-zinc-950 for professional clean look */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 bg-zinc-950 border-r border-white/[0.08] flex flex-col transition-all duration-300 h-screen md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 md:w-20' : 'w-64'}`}
      >
        {/* Desktop Collapse Toggle Floating Button */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-7 -right-3 z-55 w-6 h-6 bg-zinc-900 border border-white/[0.08] hover:border-primary/50 text-zinc-400 hover:text-white rounded-full items-center justify-center cursor-pointer transition-all shadow-md hover:scale-105"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon size={12} />
          ) : (
            <ChevronLeftIcon size={12} />
          )}
        </button>

        {/* Mobile close button inside sidebar header */}
        <div className="md:hidden absolute top-5 right-5 z-50">
          <button
            onClick={closeSidebar}
            className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Branding */}
        <SidebarBrand isCollapsed={isCollapsed} />

        {/* Navigation list */}
        <SidebarNav isCollapsed={isCollapsed} onItemClick={closeSidebar} />

        {/* Sidebar Footer */}
        <SidebarFooter
          userEmail={userEmail}
          profileName={profileName}
          avatarUrl={avatarUrl}
          credits={credits}
          isCollapsed={isCollapsed}
        />
      </aside>
    </>
  )
}
