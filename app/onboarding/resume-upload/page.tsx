'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SparklesIcon, FileTextIcon, LogOutIcon } from '@/components/icons'
import { signOut } from '@/app/actions/auth'

/**
 * Renders the resume upload onboarding page.
 */
export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'extracting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (selectedFile: File): boolean => {
    setErrorMessage(null)
    const filename = selectedFile.name.toLowerCase()
    
    // File type validation (extension + MIME)
    const isPDF = selectedFile.type === 'application/pdf' || filename.endsWith('.pdf')
    const isDOCX = selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.endsWith('.docx')
    
    if (!isPDF && !isDOCX) {
      setErrorMessage('Invalid file type. Only PDF and DOCX files are allowed.')
      return false
    }

    // File size validation (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 5MB limit.')
      return false
    }

    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return

    setUploadState('uploading')
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Post to route handler
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload and processing failed.')
      }

      setUploadState('extracting')
      
      // Simulate small transition for UI polish
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      setUploadState('success')
      
      if (data.isPartial) {
        setSuccessMessage('Resume uploaded, but some profile fields could not be extracted automatically. You can edit them now!')
      } else {
        setSuccessMessage('Profile successfully extracted and synced!')
      }

      // Small delay before redirect so user can see success state
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setUploadState('error')
      setErrorMessage(err.message || 'An error occurred during upload. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute w-[500px] h-[500px] -top-40 -left-20 bg-primary/10 blur-[130px] rounded-full" />
        <div className="absolute w-[500px] h-[500px] -bottom-40 -right-20 bg-primary/5 blur-[130px] rounded-full" />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Onboarding Box */}
        <div className="border border-zinc-200/80 bg-zinc-50/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4 animate-bounce">
              <SparklesIcon size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
              Let's Set Up Your Profile
            </h1>
            <p className="text-sm text-zinc-600 max-w-sm">
              Upload your resume in PDF or DOCX format. Our AI will automatically pre-fill your professional details to get you started.
            </p>
          </div>

          {/* Form / Drag & Drop Area */}
          {uploadState === 'idle' || uploadState === 'error' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-350 min-h-[220px] ${
                dragActive 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-zinc-200 bg-zinc-100/10 hover:border-zinc-300 hover:bg-zinc-100/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-4 transition-colors">
                <FileTextIcon size={24} className={file ? 'text-primary' : ''} />
              </div>

              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-800 truncate max-w-[280px] mx-auto">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    Drag and drop your file here, or <span className="text-primary font-semibold">browse</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Accepts PDF or DOCX up to 5MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Upload / Extract Processing State */
            <div className="border border-zinc-200 bg-zinc-100/10 rounded-2xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center">
              
              {/* Spinner/Status Icons */}
              {uploadState === 'uploading' && (
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-200/50" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                </div>
              )}

              {uploadState === 'extracting' && (
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center text-primary bg-primary/10 rounded-2xl border border-primary/25 animate-pulse">
                  <SparklesIcon size={32} />
                </div>
              )}

              {uploadState === 'success' && (
                <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-600 flex items-center justify-center animate-scale-in">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* State Labels */}
              <h3 className="text-base font-bold text-zinc-800">
                {uploadState === 'uploading' && 'Uploading Resume...'}
                {uploadState === 'extracting' && 'AI Reading & Processing Resume...'}
                {uploadState === 'success' && 'Onboarding Completed!'}
              </h3>
              
              <p className="text-xs text-zinc-500 mt-2 max-w-[280px]">
                {uploadState === 'uploading' && 'Sending file securely to storage.'}
                {uploadState === 'extracting' && 'Parsing skills, experiences, and details. This may take 5-10 seconds.'}
                {uploadState === 'success' && 'Redirecting to your dashboard...'}
              </p>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-xs font-semibold">
              {successMessage}
            </div>
          )}

          {/* Buttons Footer */}
          <div className="mt-8 flex gap-3">
            <form action={signOut} className="w-1/3">
              <button
                type="submit"
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 font-semibold text-sm transition-all cursor-pointer"
              >
                <LogOutIcon size={16} />
                Sign Out
              </button>
            </form>
            
            <button
              onClick={handleUpload}
              disabled={!file || uploadState === 'uploading' || uploadState === 'extracting' || uploadState === 'success'}
              className="flex-1 h-11 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-lg hover:shadow-primary/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
