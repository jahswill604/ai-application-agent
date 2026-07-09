'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExtractedProfile } from '@/types/profile'

interface ProfileEditorProps {
  initialProfile: ExtractedProfile
}

type TabType = 'personal' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications'

// ─── Reusable Field Components ────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{children}</label>
}

function TextInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  )
}

function TextArea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-y"
    />
  )
}

function SaveButton({ isSaving, label }: { isSaving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="w-full py-3.5 bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
    >
      {isSaving ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Saving...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'summary', label: 'Summary', icon: '📝' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
  { id: 'certifications', label: 'Certifications', icon: '🏆' },
]

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [profile, setProfile] = useState<ExtractedProfile>({
    full_name: initialProfile.full_name || '',
    headline: initialProfile.headline || '',
    email: initialProfile.email || '',
    phone: initialProfile.phone || '',
    location: initialProfile.location || '',
    summary: initialProfile.summary || '',
    skills: initialProfile.skills || [],
    work_experience: initialProfile.work_experience || [],
    education: initialProfile.education || [],
    projects: initialProfile.projects || [],
    certifications: initialProfile.certifications || [],
    contact_details: initialProfile.contact_details || { linkedin: '', github: '', website: '', languages: [] },
  })

  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [newCert, setNewCert] = useState('')
  const router = useRouter()

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, contact_details: { ...prev.contact_details, [name]: value } }))
  }

  const handleSave = async (sectionName = 'info') => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save.')
      setSaveStatus('success')
      router.refresh()
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message || 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  // Work
  const handleWorkChange = (i: number, field: string, value: string) =>
    setProfile(p => { const u = [...p.work_experience]; u[i] = { ...u[i], [field]: value }; return { ...p, work_experience: u } })
  const addWork = () => setProfile(p => ({ ...p, work_experience: [...p.work_experience, { company: '', title: '', start: '', end: '', description: '' }] }))
  const removeWork = (i: number) => setProfile(p => ({ ...p, work_experience: p.work_experience.filter((_, j) => j !== i) }))

  // Education
  const handleEduChange = (i: number, field: string, value: string) =>
    setProfile(p => { const u = [...p.education]; u[i] = { ...u[i], [field]: value }; return { ...p, education: u } })
  const addEdu = () => setProfile(p => ({ ...p, education: [...p.education, { school: '', degree: '', field: '', start: '', end: '' }] }))
  const removeEdu = (i: number) => setProfile(p => ({ ...p, education: p.education.filter((_, j) => j !== i) }))

  // Projects
  const handleProjectChange = (i: number, field: string, value: string) =>
    setProfile(p => { const u = [...p.projects]; u[i] = { ...u[i], [field]: value }; return { ...p, projects: u } })
  const addProject = () => setProfile(p => ({ ...p, projects: [...p.projects, { name: '', description: '' }] }))
  const removeProject = (i: number) => setProfile(p => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))

  // Skills
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && newSkill.trim()) {
      e.preventDefault()
      const clean = newSkill.trim().replace(/,$/, '')
      if (clean && !profile.skills.includes(clean)) setProfile(p => ({ ...p, skills: [...p.skills, clean] }))
      setNewSkill('')
    }
  }
  const removeSkill = (skill: string) => setProfile(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))

  // Certs
  const handleAddCert = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCert.trim()) {
      e.preventDefault()
      if (!profile.certifications.includes(newCert.trim())) setProfile(p => ({ ...p, certifications: [...p.certifications, newCert.trim()] }))
      setNewCert('')
    }
  }
  const removeCert = (cert: string) => setProfile(p => ({ ...p, certifications: p.certifications.filter(c => c !== cert) }))

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Gradient Header Band */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      {/* Page Header */}
      <div className="px-8 pt-7 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
            <p className="text-sm text-gray-400 mt-1">Keep your professional information up to date.</p>
          </div>
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border border-rose-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Tabs — scrollable, no visible scrollbar or native scroll arrows */}
        <div className="relative">
          <div
            className="flex border-b border-gray-100"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6">
        {/* ── PERSONAL ── */}
        {activeTab === 'personal' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('personal') }} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <TextInput name="full_name" value={profile.full_name || ''} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div>
                <FieldLabel>Headline</FieldLabel>
                <TextInput name="headline" value={profile.headline || ''} onChange={handleChange} placeholder="Senior Software Engineer" />
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <TextInput type="email" name="email" value={profile.email || ''} onChange={handleChange} placeholder="john@example.com" />
              </div>
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <TextInput name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="+1 234 567 8901" />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Location</FieldLabel>
                <TextInput name="location" value={profile.location || ''} onChange={handleChange} placeholder="Lagos, Nigeria" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Online Presence</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>LinkedIn</FieldLabel>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs font-semibold">in/</span>
                    <input
                      name="linkedin"
                      value={profile.contact_details?.linkedin || ''}
                      onChange={handleContactChange}
                      placeholder="your-username"
                      className="w-full h-10 pl-8 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>GitHub</FieldLabel>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs font-semibold">@</span>
                    <input
                      name="github"
                      value={profile.contact_details?.github || ''}
                      onChange={handleContactChange}
                      placeholder="your-username"
                      className="w-full h-10 pl-7 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Website</FieldLabel>
                  <input
                    name="website"
                    value={profile.contact_details?.website || ''}
                    onChange={handleContactChange}
                    placeholder="https://yoursite.com"
                    className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <SaveButton isSaving={isSaving} label="Save Personal Info" />
            </div>
          </form>
        )}

        {/* ── SUMMARY ── */}
        {activeTab === 'summary' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('summary') }} className="space-y-5">
            <div>
              <FieldLabel>Professional Summary</FieldLabel>
              <p className="text-xs text-gray-400 mb-2">Write a compelling 3–5 sentence summary that highlights your key experience and what you bring to the table.</p>
              <TextArea name="summary" rows={12} value={profile.summary || ''} onChange={handleChange} placeholder="I am a passionate software engineer with 5+ years of experience building scalable web applications..." />
            </div>
            <SaveButton isSaving={isSaving} label="Save Summary" />
          </form>
        )}

        {/* ── SKILLS ── */}
        {activeTab === 'skills' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('skills') }} className="space-y-5">
            <div>
              <FieldLabel>Add Skills</FieldLabel>
              <p className="text-xs text-gray-400 mb-2">Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded border border-gray-200">Enter</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded border border-gray-200">,</kbd> to add each skill.</p>
              <TextInput
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="e.g. React, Node.js, Python..."
              />
            </div>
            {profile.skills.length > 0 && (
              <div>
                <FieldLabel>Your Skills ({profile.skills.length})</FieldLabel>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[60px]">
                  {profile.skills.map(skill => (
                    <span key={skill} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:border-rose-200 hover:bg-rose-50 transition-colors">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-gray-300 group-hover:text-rose-400 font-bold transition-colors leading-none">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <SaveButton isSaving={isSaving} label="Save Skills" />
          </form>
        )}

        {/* ── EXPERIENCE ── */}
        {activeTab === 'experience' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('experience') }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Work Experience</p>
                <p className="text-xs text-gray-400">{profile.work_experience.length} position{profile.work_experience.length !== 1 ? 's' : ''} added</p>
              </div>
              <button type="button" onClick={addWork} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Position
              </button>
            </div>

            {profile.work_experience.length === 0 && (
              <div className="flex items-center gap-3 py-5 px-5 text-left bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="text-2xl">💼</span>
                <div>
                  <p className="text-sm font-semibold text-gray-500">No experience added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Position" to get started</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {profile.work_experience.map((work, idx) => (
                <div key={idx} className="p-6 border border-gray-200 rounded-2xl space-y-4 relative bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Position {idx + 1}</span>
                    <button type="button" onClick={() => removeWork(idx)} className="text-xs text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Company</FieldLabel>
                      <TextInput value={work.company} onChange={e => handleWorkChange(idx, 'company', e.target.value)} placeholder="Google" />
                    </div>
                    <div>
                      <FieldLabel>Job Title</FieldLabel>
                      <TextInput value={work.title} onChange={e => handleWorkChange(idx, 'title', e.target.value)} placeholder="Software Engineer" />
                    </div>
                    <div>
                      <FieldLabel>Start Date</FieldLabel>
                      <TextInput value={work.start || ''} onChange={e => handleWorkChange(idx, 'start', e.target.value)} placeholder="Jan 2022" />
                    </div>
                    <div>
                      <FieldLabel>End Date</FieldLabel>
                      <TextInput value={work.end || ''} onChange={e => handleWorkChange(idx, 'end', e.target.value)} placeholder="Present" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Description / Achievements</FieldLabel>
                    <TextArea rows={5} value={work.description || ''} onChange={e => handleWorkChange(idx, 'description', e.target.value)} placeholder="• Led development of key features that increased user retention by 20%&#10;• Managed a team of 4 engineers..." />
                  </div>
                </div>
              ))}
            </div>

            <SaveButton isSaving={isSaving} label="Save Experience" />
          </form>
        )}

        {/* ── EDUCATION ── */}
        {activeTab === 'education' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('education') }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Education</p>
                <p className="text-xs text-gray-400">{profile.education.length} institution{profile.education.length !== 1 ? 's' : ''} added</p>
              </div>
              <button type="button" onClick={addEdu} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Education
              </button>
            </div>

            {profile.education.length === 0 && (
              <div className="flex items-center gap-3 py-5 px-5 text-left bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-sm font-semibold text-gray-500">No education added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Education" to get started</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {profile.education.map((edu, idx) => (
                <div key={idx} className="p-6 border border-gray-200 rounded-2xl space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Institution {idx + 1}</span>
                    <button type="button" onClick={() => removeEdu(idx)} className="text-xs text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FieldLabel>School / Institution</FieldLabel>
                      <TextInput value={edu.school} onChange={e => handleEduChange(idx, 'school', e.target.value)} placeholder="University of Lagos" />
                    </div>
                    <div>
                      <FieldLabel>Degree</FieldLabel>
                      <TextInput value={edu.degree || ''} onChange={e => handleEduChange(idx, 'degree', e.target.value)} placeholder="Bachelor of Science" />
                    </div>
                    <div>
                      <FieldLabel>Field of Study</FieldLabel>
                      <TextInput value={edu.field || ''} onChange={e => handleEduChange(idx, 'field', e.target.value)} placeholder="Computer Science" />
                    </div>
                    <div>
                      <FieldLabel>Start Date</FieldLabel>
                      <TextInput value={edu.start || ''} onChange={e => handleEduChange(idx, 'start', e.target.value)} placeholder="Sep 2018" />
                    </div>
                    <div>
                      <FieldLabel>End Date</FieldLabel>
                      <TextInput value={edu.end || ''} onChange={e => handleEduChange(idx, 'end', e.target.value)} placeholder="Jun 2022" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SaveButton isSaving={isSaving} label="Save Education" />
          </form>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('projects') }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Projects</p>
                <p className="text-xs text-gray-400">{profile.projects.length} project{profile.projects.length !== 1 ? 's' : ''} added</p>
              </div>
              <button type="button" onClick={addProject} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Project
              </button>
            </div>

            {profile.projects.length === 0 && (
              <div className="flex items-center gap-3 py-5 px-5 text-left bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="text-sm font-semibold text-gray-500">No projects added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Project" to showcase your work</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {profile.projects.map((proj, idx) => (
                <div key={idx} className="p-6 border border-gray-200 rounded-2xl space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project {idx + 1}</span>
                    <button type="button" onClick={() => removeProject(idx)} className="text-xs text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      Remove
                    </button>
                  </div>
                  <div>
                    <FieldLabel>Project Name</FieldLabel>
                    <TextInput value={proj.name} onChange={e => handleProjectChange(idx, 'name', e.target.value)} placeholder="My Awesome Project" />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextArea rows={4} value={proj.description || ''} onChange={e => handleProjectChange(idx, 'description', e.target.value)} placeholder="A brief description of what the project does, technologies used, and the impact it had..." />
                  </div>
                </div>
              ))}
            </div>

            <SaveButton isSaving={isSaving} label="Save Projects" />
          </form>
        )}

        {/* ── CERTIFICATIONS ── */}
        {activeTab === 'certifications' && (
          <form onSubmit={e => { e.preventDefault(); handleSave('certifications') }} className="space-y-5">
            <div>
              <FieldLabel>Add Certification</FieldLabel>
              <p className="text-xs text-gray-400 mb-2">Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded border border-gray-200">Enter</kbd> to add each certification.</p>
              <TextInput
                value={newCert}
                onChange={e => setNewCert(e.target.value)}
                onKeyDown={handleAddCert}
                placeholder="e.g. AWS Certified Solutions Architect"
              />
            </div>

            {profile.certifications.length > 0 && (
              <div>
                <FieldLabel>Your Certifications ({profile.certifications.length})</FieldLabel>
                <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.certifications.map((cert, idx) => (
                    <div key={cert} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-50 text-amber-500 text-xs font-bold">{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-700">{cert}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCert(cert)}
                        title="Remove certification"
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.certifications.length === 0 && (
              <div className="flex items-center gap-3 py-5 px-5 text-left bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-semibold text-gray-500">No certifications added yet</p>
                  <p className="text-xs text-gray-400">Type above and press Enter to add one</p>
                </div>
              </div>
            )}

            <SaveButton isSaving={isSaving} label="Save Certifications" />
          </form>
        )}
      </div>
    </div>
  )
}
