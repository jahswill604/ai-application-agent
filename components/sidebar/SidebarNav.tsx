'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BriefcaseIcon,
  FileTextIcon,
  UserIcon,
  ListChecksIcon,
} from '@/components/icons'

interface SidebarNavProps {
  isCollapsed?: boolean
  onItemClick?: () => void
}

export default function SidebarNav({ isCollapsed = false, onItemClick }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Jobs',
      href: '/dashboard/jobs',
      icon: BriefcaseIcon,
    },
    {
      label: 'Resume',
      href: '/dashboard/resume',
      icon: FileTextIcon,
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: UserIcon,
    },
    {
      label: 'Application Status',
      href: '/dashboard/applications',
      icon: ListChecksIcon,
    },
  ]

  return (
    <nav
      className={`flex-1 py-8 space-y-3.5 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'px-4 md:px-2' : 'px-4'
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center rounded-xl text-[17px] font-semibold transition-all duration-200 group border-l-3 ${
              isActive
                ? 'bg-primary/10 text-primary border-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-transparent'
            } ${
              isCollapsed
                ? 'px-5 py-4 gap-4 w-full h-auto md:justify-center md:p-3 md:w-12 md:h-12 md:mx-auto md:border-l-0 md:border-t-3 md:border-r-0'
                : 'gap-4 px-5 py-4.5'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon
              className={`transition-colors duration-200 flex-shrink-0 ${
                isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              size={22}
            />
            <span className={`truncate ${isCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
