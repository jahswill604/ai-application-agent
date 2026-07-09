/**
 * TypeScript types for the jobs feature.
 * Mirrors the Supabase public.jobs table schema.
 */

export type JobPlatform = 'greenhouse' | 'lever' | 'workable' | 'wellfound'

export interface JobRow {
  id: string
  user_id: string

  // Platform & source
  platform: JobPlatform
  job_url: string | null
  source_url: string | null

  // Job details
  title: string
  company: string | null
  company_logo: string | null
  location: string | null
  salary: string | null
  job_type: string | null
  experience_level: string | null
  description: string | null

  // Structured data
  tags: string[]

  // AI scoring
  match_score: number

  // User interaction flags
  applied_status: boolean
  saved_status: boolean

  // Timestamps
  fetched_at: string
  created_at: string
}

/**
 * Platform metadata for the UI cards.
 */
export interface PlatformMeta {
  id: JobPlatform
  name: string
  domain: string
  color: string
  description: string
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    domain: 'greenhouse.io',
    color: '#24a148',
    description: 'Enterprise ATS',
  },
  {
    id: 'lever',
    name: 'Lever',
    domain: 'lever.co',
    color: '#4f46e5',
    description: 'Modern hiring',
  },
  {
    id: 'workable',
    name: 'Workable',
    domain: 'workable.com',
    color: '#0ea5e9',
    description: 'SMB recruiting',
  },
  {
    id: 'wellfound',
    name: 'Wellfound',
    domain: 'wellfound.com',
    color: '#f97316',
    description: 'Startup jobs',
  },
]

/**
 * Response shape from /api/jobs
 */
export interface JobsApiResponse {
  jobs: JobRow[]
  fromCache: boolean
  fetchedAt: string | null
  error?: string
}
