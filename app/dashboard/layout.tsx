import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar/Sidebar'

export const metadata = {
  title: 'Dashboard — AI Application Agent',
  description: 'Your AI-powered job application dashboard.',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  // Use getUser() for secure server-side auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/')
  }

  // Fetch the user's profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">
      {/* Ambient glassmorphic backgrounds using the new primary color #ACF417 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute w-[500px] h-[500px] -top-40 -right-20 bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute w-[400px] h-[400px] -bottom-20 -left-20 bg-zinc-800/10 blur-[100px] rounded-full" />
      </div>

      {/* Responsive Sidebar */}
      <Sidebar
        userEmail={user.email ?? ''}
        profileName={profile?.name}
        avatarUrl={profile?.avatar}
        credits={{ remaining: 120, max: 300 }} // Mock credits or expand as needed
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
