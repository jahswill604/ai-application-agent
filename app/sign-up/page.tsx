'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  function validate(): string | null {
    if (!name.trim()) return 'Name is required.'
    if (!email.includes('@')) return 'Enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    return null
  }

  function getFriendlyError(msg: string): string {
    if (msg.includes('User already registered'))
      return 'An account with this email already exists.'
    return msg
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(getFriendlyError(error.message))
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-black">
      {/* Left side - Dark Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#090A0F] flex-col justify-between p-16 overflow-hidden border-r border-white/[0.03]">
        {/* Glow effect at bottom right */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.05] flex items-center justify-center font-medium text-white text-[13px]">
            AI
          </div>
          <span className="text-white/80 font-medium text-[15px] tracking-tight">Job Agent</span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-[480px] mt-auto mb-auto">
          <h1 className="text-[38px] leading-[1.2] font-semibold text-white tracking-tight mb-5">
            Apply smarter, not harder
          </h1>
          <p className="text-[#888b94] text-[15px] leading-relaxed">
            Track applications, tailor resumes, and let AI handle the repetitive work so you can focus on landing the right role.
          </p>
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 text-[12px] text-white/30 tracking-tight">
          AI-powered job search and application management.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white h-screen overflow-y-auto py-12">
        <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center px-8 lg:px-10">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-[28px] font-bold">
                ✓
              </div>
              <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">Check your email</h2>
              <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
                We sent a confirmation link to <strong className="text-gray-900 font-semibold">{email}</strong>. Click it to activate your account.
              </p>
              <Link
                href="/"
                className="w-full block py-2.5 px-4 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white text-[14px] font-medium rounded-lg transition-colors text-center"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1">
                  Create your account
                </h1>
                <p className="text-gray-500 text-[14px]">
                  Start using AI Application Agent today — it&apos;s free.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleSignUp}
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="flex items-center my-5">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-[11px] text-gray-400 bg-white">or sign up with email</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#eef2fc] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-[14px]"
                    required
                    disabled={loading}
                    placeholder="Alice Smith"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#eef2fc] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-[14px]"
                    required
                    disabled={loading}
                    placeholder="alice@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#eef2fc] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-[14px]"
                    required
                    disabled={loading}
                    placeholder="Min. 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-[13px] text-gray-500 mt-6">
                Already have an account?{' '}
                <Link href="/" className="font-semibold text-black hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
