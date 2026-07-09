import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from './ProfileEditor'
import ProfileCompletenessCard from '@/components/profile/ProfileCompletenessCard'
import { ExtractedProfile } from '@/types/profile'

export const metadata = {
  title: 'Profile — AI Application Agent',
  description: 'Manage your professional profile details.',
}

/**
 * Renders the authenticated profile management page.
 *
 * Redirects to `/` when there is no authenticated user, and to `/onboarding/resume-upload` when no profile record exists.
 */
export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/')
  }

  // 2. Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // If no profile, they must onboarding first
    redirect('/onboarding/resume-upload')
  }

  // Helper to parse double stringified or empty jsonb values
  const parseJsonbArray = (val: any): any[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const initialProfile: ExtractedProfile = {
    full_name: profile.full_name || '',
    headline: profile.headline || '',
    email: profile.email || profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    summary: profile.summary || '',
    skills: parseJsonbArray(profile.skills),
    work_experience: parseJsonbArray(profile.work_experience),
    education: parseJsonbArray(profile.education),
    projects: parseJsonbArray(profile.projects),
    certifications: parseJsonbArray(profile.certifications),
    contact_details: profile.contact_details || {},
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      <div className="lg:self-start">
        <ProfileCompletenessCard profile={initialProfile} />
      </div>
      <div>
        <ProfileEditor initialProfile={initialProfile} />
      </div>
    </div>
  )
}
