import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Handles the Supabase OAuth callback and redirects after exchanging the authorization code.
 *
 * Redirects to the password reset page for recovery flows, to the requested `next` path on success,
 * or to the home page with an authentication callback error when the code is missing or exchange fails.
 *
 * @param request - The incoming callback request.
 */
export async function GET(request: NextRequest) {
  console.log('--- Auth Callback Initiated ---')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log(`URL: ${request.url}`)
  console.log(`Code: ${code ? 'Present' : 'Missing'}, Type: ${type}, Next: ${next}`)

  if (code) {
    try {
      const supabase = await createClient()
      console.log('Supabase client created successfully')
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('exchangeCodeForSession error:', error.message)
        throw error
      }
      
      console.log('Session exchanged successfully. User ID:', data.user?.id)

      // For password reset flows, redirect to the reset page
      if (type === 'recovery') {
        console.log('Redirecting to reset-password')
        return redirect(`${origin}/reset-password`)
      }
      
      console.log(`Redirecting to: ${origin}${next}`)
      return redirect(`${origin}${next}`)
    } catch (err: any) {
      console.error('Exception caught in auth callback exchange:', err?.message || err)
      return redirect(`${origin}/?error=auth_callback_failed&msg=${encodeURIComponent(err?.message || 'unknown')}`)
    }
  }

  console.log('No code found, redirecting to home')
  return redirect(`${origin}/?error=auth_callback_failed`)
}

