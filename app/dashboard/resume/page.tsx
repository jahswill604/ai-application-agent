import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileTextIcon, SparklesIcon } from '@/components/icons'
import DeleteResumeButton from './components/DeleteResumeButton'

export const metadata = {
  title: 'Resume — AI Application Agent',
  description: 'Manage your uploaded resumes.',
}

/**
 * Renders the authenticated resume dashboard.
 *
 * Displays the user's active resume details and download actions when a resume exists, or an empty state with an upload link when no active resume is found.
 *
 * @returns The rendered resume page content.
 */
export default async function ResumePage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/')
  }

  // 2. Fetch all resumes from DB
  const { data: resumes, error: resumeError } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  let resumesWithUrls: any[] = []

  // 3. Generate short-lived signed URL for download for all resumes
  if (resumes && resumes.length > 0) {
    resumesWithUrls = await Promise.all(
      resumes.map(async (resume) => {
        let downloadUrl = ''
        const { data: signedData, error: signedError } = await supabase.storage
          .from('resumes')
          .createSignedUrl(resume.storage_path, 60) // 60-second expiry

        if (!signedError && signedData) {
          downloadUrl = signedData.signedUrl
        }
        return { ...resume, downloadUrl }
      })
    )
  }

  // Helper to format bytes to readable format
  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          <FileTextIcon size={24} className="text-primary" />
          My Resumes
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage, download, or update your uploaded resumes.
        </p>
      </div>

      {resumesWithUrls.length > 0 ? (
        <div className="space-y-6">
          {resumesWithUrls.map((resume) => (
            /* Resume Details Card */
            <div key={resume.id} className="border border-zinc-200 bg-white rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                    <FileTextIcon size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-zinc-800 truncate max-w-xs md:max-w-md">
                      {resume.file_name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Uploaded at {new Date(resume.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {resume.status === 'active' && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
                      Active
                    </span>
                  )}
                  <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
                    v{resume.version}
                  </span>
                </div>
              </div>

              {/* Details Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">File Size</span>
                  <p className="text-sm font-semibold text-zinc-700">{formatBytes(resume.file_size_bytes)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">MIME Type</span>
                  <p className="text-sm font-semibold text-zinc-700 truncate">{resume.mime_type || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Storage Path</span>
                  <p className="text-sm font-semibold text-zinc-700 truncate max-w-[200px]" title={resume.storage_path}>
                    {resume.storage_path}
                  </p>
                </div>
              </div>

              {/* Alert Callout for active resume */}
              {resume.status === 'active' && (
                <div className="flex gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <SparklesIcon size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800">Connected to Profile</h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      This resume is parsed and synchronized with your professional profile data. 
                      Replacing this resume will re-run the AI extraction pipeline, update profile entries, and archive this file.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {resume.downloadUrl ? (
                  <a
                    href={resume.downloadUrl}
                    download={resume.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 px-6 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    Download Resume File
                  </a>
                ) : (
                  <button
                    disabled
                    className="h-11 px-6 bg-primary text-primary-foreground font-bold text-sm rounded-xl opacity-50 cursor-not-allowed flex items-center justify-center"
                  >
                    Link Expired (Refresh page)
                  </button>
                )}
                
                {resume.status === 'active' && (
                  <Link
                    href="/onboarding/resume-upload"
                    className="h-11 px-6 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-zinc-700 font-semibold text-sm transition-all flex items-center justify-center"
                  >
                    Replace Resume
                  </Link>
                )}
                
                <DeleteResumeButton id={resume.id} storagePath={resume.storage_path} />
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="border border-zinc-200 bg-zinc-50/50 rounded-3xl p-10 text-center backdrop-blur-md">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-500 mb-4 animate-pulse">
            <FileTextIcon size={22} />
          </div>
          <h3 className="text-base font-semibold text-zinc-800">No Active Resume</h3>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">
            You must upload a resume to unlock and start using the dashboard features.
          </p>
          <div className="mt-6">
            <Link
              href="/onboarding/resume-upload"
              className="inline-flex h-10 px-5 bg-primary text-primary-foreground font-bold text-xs items-center justify-center rounded-xl hover:bg-primary/95 transition-all shadow-md"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
