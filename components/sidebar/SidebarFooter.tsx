import React from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { SettingsIcon, LogOutIcon } from '@/components/icons'

interface SidebarFooterProps {
  userEmail: string
  profileName?: string
  avatarUrl?: string
  credits?: {
    remaining: number
    max: number
  }
  isCollapsed?: boolean
}

export default function SidebarFooter({
  userEmail,
  profileName,
  avatarUrl,
  credits = { remaining: 120, max: 300 },
  isCollapsed = false,
}: SidebarFooterProps) {
  const displayName = profileName ?? userEmail.split('@')[0] ?? 'User'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const creditPercentage = Math.round((credits.remaining / credits.max) * 100)

  return (
    <div className="mt-auto border-t border-white/[0.08] bg-black/10">
      {/* 1. COLLAPSED VIEW FOR DESKTOP ONLY */}
      <div className={`py-4 flex flex-col items-center gap-4 ${isCollapsed ? 'hidden md:flex' : 'hidden'}`}>
        {/* Simple Avatar */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-200 overflow-hidden border border-white/[0.08]"
          title={`${displayName} (${credits.remaining}/${credits.max} credits)`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Vertical Actions */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] rounded-lg transition-colors"
            title="Profile Settings"
          >
            <SettingsIcon size={16} />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOutIcon size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* 2. EXPANDED VIEW FOR MOBILE & DESKTOP (responsive based on isCollapsed) */}
      <div className={isCollapsed ? 'block md:hidden' : 'block'}>
        {/* Credits block */}
        <div className="p-4 mx-2 my-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-300 mb-2">
            <span>Usage / Credits</span>
            <span className="text-primary font-bold">
              {credits.remaining} / {credits.max}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500"
              style={{ width: `${creditPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2.5">
            <span className="text-[10px] text-zinc-500">Credits reset monthly</span>
            <Link
              href="/dashboard/profile"
              className="text-[10px] text-primary hover:text-primary/80 font-bold"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-200 overflow-hidden border border-white/[0.08]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-zinc-200 truncate leading-none">
                  {displayName}
                </p>
                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold border border-primary/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate mt-1">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard/profile"
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] rounded-lg transition-colors"
              title="Profile Settings"
            >
              <SettingsIcon size={16} />
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOutIcon size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
