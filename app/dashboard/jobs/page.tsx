import React from 'react'
import { BriefcaseIcon, SparklesIcon } from '@/components/icons'

export const metadata = {
  title: 'Jobs — AI Application Agent',
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  matchScore: number
  description: string
  postedTime: string
  status: 'idle' | 'applied' | 'tailoring'
}

const dummyJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer (React/Next.js)',
    company: 'Stripe',
    location: 'Remote (US/Canada) • Full-time',
    salary: '$165,000 - $210,000 / year',
    matchScore: 98,
    description: 'Lead the architectural design and implementation of next-generation developer dashboard features. Experience with React, Next.js, and TypeScript is highly required.',
    postedTime: '2 hours ago',
    status: 'idle',
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Linear',
    location: 'Remote (Global) • Full-time',
    salary: '$140,000 - $180,000 / year',
    matchScore: 92,
    description: 'Help build the future of software project management tools. Work closely with product design to build highly responsive, state-synchronized interfaces.',
    postedTime: '1 day ago',
    status: 'idle',
  },
  {
    id: '3',
    title: 'AI/ML Platform Engineer',
    company: 'Vercel',
    location: 'San Francisco, CA • Hybrid',
    salary: '$180,000 - $230,000 / year',
    matchScore: 88,
    description: 'Integrate state-of-the-art Large Language Models and multi-agent systems into Vercel’s serverless deployment platform. Focus on performance, caching, and streaming APIs.',
    postedTime: '3 days ago',
    status: 'applied',
  },
  {
    id: '4',
    title: 'Product Designer (Design Systems)',
    company: 'Figma',
    location: 'London, UK • Hybrid',
    salary: '£90,000 - £120,000 / year',
    matchScore: 78,
    description: 'Work directly on Figma’s core component engine and design system library tools. Help millions of developers and designers align their components.',
    postedTime: '1 week ago',
    status: 'idle',
  }
]

export default function JobsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <BriefcaseIcon size={24} className="text-primary" />
            Jobs
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Browse targeted job listings tailored to your resume match score.
          </p>
        </div>
        
        {/* Status Counts */}
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-600">
            Total Matches: <span className="text-zinc-900">{dummyJobs.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600">
            Applied: <span className="text-emerald-900">{dummyJobs.filter(j => j.status === 'applied').length}</span>
          </div>
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 gap-4">
        {dummyJobs.map((job) => (
          <div 
            key={job.id} 
            className="border border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50/70 transition-all rounded-3xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            {/* Left side: Job details */}
            <div className="flex items-start gap-4 flex-1">
              {/* Company Logo Badge */}
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
                {job.company.charAt(0)}
              </div>
              
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-bold text-zinc-800 truncate">
                    {job.title}
                  </h3>
                  {/* AI Match Badge */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full uppercase">
                    <SparklesIcon size={10} />
                    {job.matchScore}% Match
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 font-medium">
                  {job.company} • {job.location}
                </p>
                
                <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                  <span className="font-semibold text-zinc-500">{job.salary}</span>
                  <span>•</span>
                  <span>Posted {job.postedTime}</span>
                </div>
              </div>
            </div>

            {/* Right side: Action Controls */}
            <div className="flex sm:flex-row md:flex-col items-stretch gap-2.5 md:w-[160px] justify-end">
              {job.status === 'applied' ? (
                <button 
                  disabled
                  className="h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1.5 w-full cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Applied
                </button>
              ) : (
                <>
                  <button 
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 w-full hover:bg-primary/95 transition-all shadow-md hover:shadow-primary/10 cursor-pointer"
                  >
                    Apply with AI
                  </button>
                  <button 
                    className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs flex items-center justify-center w-full transition-all cursor-pointer"
                  >
                    Tailor Resume
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
