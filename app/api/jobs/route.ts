import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { JobRow, JobPlatform } from '@/types/job'
import { GoogleGenAI } from '@google/genai'

// ─── Constants ───────────────────────────────────────────────────────────────
const CACHE_HOURS   = 6
const MAX_RESULTS_PER_PLATFORM = 10  // match user's limit: 10
const MIN_MATCH_SCORE = 20           // lowered to 20 to allow more jobs to pass through filtering

// Platform domain mappings — these are the real job application board domains
const PLATFORM_DOMAINS: Record<JobPlatform, string> = {
  greenhouse: 'boards.greenhouse.io',
  lever:      'jobs.lever.co',
  workable:   'apply.workable.com',
  wellfound:  'wellfound.com',
}

// ─── Profile shape used for search ──────────────────────────────────────────

interface SearchProfile {
  role:            string | null
  skills:          string[]       // e.g. ["React", "TypeScript", "Node.js"]
  techStack:       string[]       // derived from skills — top frameworks/languages
  location:        string | null  // e.g. "Port Harcourt, Nigeria"
  country:         string | null  // e.g. "Nigeria"
  city:            string | null  // e.g. "Port Harcourt"
  headline:        string | null
  certifications:  string[]
  experienceLevel: string         // 'Junior' | 'Mid-level' | 'Senior'
  jobType:         string | null  // 'Full-time' | 'Contract' | 'Part-time' | null
  educationField:  string | null  // e.g. "Computer Science"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a location string like "Port Harcourt, Nigeria" into city + country.
 */
function parseLocation(location: string | null): { city: string | null; country: string | null } {
  if (!location) return { city: null, country: null }
  const parts = location.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] }
  }
  // Single token — could be country or city; treat as city
  return { city: parts[0] || null, country: null }
}

/**
 * Build a platform-specific Firecrawl search query from the user's profile.
 *
 * Output examples:
 *   site:boards.greenhouse.io "Frontend Developer" React TypeScript "Port Harcourt" OR "Nigeria" OR "remote"
 *   site:jobs.lever.co "Backend Engineer" Node.js Python "remote"
 *   site:apply.workable.com "Full Stack Developer" React "Nigeria" OR "remote"
 *   site:wellfound.com/jobs "React Developer" TypeScript "remote"
 */
function buildSearchQuery(platform: JobPlatform, profile: SearchProfile): string {
  // ── Build Role variations ──────────────────────────────────────────────
  const roles: string[] = []
  
  if (profile.role) {
    roles.push(`"${profile.role.trim()}"`)
    
    // Add simplified version of role if it contains extra qualifiers like "Trainee", "Auxiliary", "Assistant"
    const cleaned = profile.role
      .replace(/trainee/i, '')
      .replace(/auxiliary/i, '')
      .replace(/assistant/i, '')
      .trim()
    if (cleaned && cleaned.length > 3 && cleaned.toLowerCase() !== profile.role.toLowerCase()) {
      roles.push(`"${cleaned}"`)
    }
  }
  
  if (profile.headline && profile.headline.trim()) {
    const headlineStr = profile.headline.trim()
    if (!roles.includes(`"${headlineStr}"`)) {
      roles.push(`"${headlineStr}"`)
    }
    
    const cleanedHeadline = headlineStr
      .replace(/trainee/i, '')
      .replace(/auxiliary/i, '')
      .replace(/assistant/i, '')
      .trim()
    if (cleanedHeadline && cleanedHeadline.length > 3 && !roles.includes(`"${cleanedHeadline}"`) && cleanedHeadline.toLowerCase() !== headlineStr.toLowerCase()) {
      roles.push(`"${cleanedHeadline}"`)
    }
  }

  // Fallback if no roles found
  if (roles.length === 0) {
    roles.push('"Software Engineer"')
  }

  const rolePart = roles.length > 1 ? `(${roles.join(' OR ')})` : roles[0]

  // ── Site operator per platform ──────────────────────────────────────────
  let sitePart: string
  switch (platform) {
    case 'greenhouse':
      sitePart = '(site:boards.greenhouse.io OR site:job-boards.greenhouse.io)'
      break
    case 'lever':
      sitePart = 'site:jobs.lever.co'
      break
    case 'workable':
      sitePart = 'site:apply.workable.com'
      break
    case 'wellfound':
      sitePart = 'site:wellfound.com/jobs'
      break
    default:
      sitePart = `site:${PLATFORM_DOMAINS[platform]}`
  }

  // ── Location part ──────────────────────────────────────────────────────
  // Include: the user's city, country, "remote", and "hybrid"
  // This way the query catches:
  //   - fully remote jobs from anywhere
  //   - hybrid jobs (often allow some remote)
  //   - on-site jobs that explicitly mention the user's city or country
  const locationTokens: string[] = []
  if (profile.city)    locationTokens.push(`"${profile.city}"`)
  if (profile.country) locationTokens.push(`"${profile.country}"`)
  locationTokens.push('"remote"')
  locationTokens.push('"hybrid"')
  const uniqueLocations = [...new Set(locationTokens)]
  const locationPart = uniqueLocations.length > 1
    ? `(${uniqueLocations.join(' OR ')})`
    : uniqueLocations[0]

  // ── Assemble ───────────────────────────────────────────────────────────
  // No skills in the query — avoids over-constraining Firecrawl's web search.
  // computeMatchScore + location guard in normalizeResult handle filtering.
  const parts = [sitePart, rolePart, locationPart]

  const query = parts.join(' ')
  console.log(`[buildSearchQuery] ${platform}: ${query}`)
  return query
}

/**
 * Weighted CV match score (0–100).
 *
 * Breakdown:
 *   40 pts — skills found in title + description (proportional)
 *   30 pts — job title contains the user's target role keywords
 *   20 pts — at least 3 skills found in the text
 *   10 pts — bonus when description exists (richer signal)
 *
 * Returns 0 when the result clearly has nothing in common with the profile.
 */
/**
 * High-fidelity CV match check (returns a score from 0 to 100).
 *
 * Breakdown:
 *   50 pts — Job title contains the user's target role keywords
 *   50 pts — Proportional matching of skills in the job details text
 */
function computeMatchScoreFallback(
  title: string,
  description: string,
  profile: SearchProfile
): number {
  const haystack = `${title} ${description ?? ''}`.toLowerCase()
  const titleLow = title.toLowerCase()

  // 1. Role / Headline Match (50 points max)
  // Check against both profile.role and profile.headline. Take the best.
  let bestRoleScore = 0
  const rolesToTry = [profile.role, profile.headline].filter(Boolean) as string[]

  for (const roleStr of rolesToTry) {
    const roleLow = roleStr.toLowerCase()
    
    // Exact phrase match in title gives immediate high score
    if (titleLow.includes(roleLow)) {
      bestRoleScore = Math.max(bestRoleScore, 50)
      continue
    }

    // Token match: check how many keywords appear in the title (allowing 2-letter tokens like RN, MA)
    const tokens = roleLow.split(/\s+/).filter(t => t.length >= 2)
    if (tokens.length > 0) {
      const hits = tokens.filter(token => titleLow.includes(token)).length
      const tokenScore = Math.round((hits / tokens.length) * 45)
      bestRoleScore = Math.max(bestRoleScore, tokenScore)
    }
  }

  // 2. Skill Match (40 points max)
  // Check both complete phrases and individual significant words of skills to avoid missing points in short snippets.
  let skillScore = 0
  if (profile.skills.length > 0) {
    let skillHits = 0
    
    for (const skill of profile.skills) {
      const skillLow = skill.toLowerCase()
      if (haystack.includes(skillLow)) {
        skillHits++
      } else if (skillLow.includes(' ')) {
        // Fallback: check if all significant words of a multi-word skill are present
        const skillTokens = skillLow.split(/\s+/).filter(t => t.length > 3)
        if (skillTokens.length > 0 && skillTokens.every(token => haystack.includes(token))) {
          skillHits++
        }
      }
    }
    
    // Cap comparison to a reasonable maximum (e.g. matching 4 skills is a strong signal)
    const maxCompare = Math.min(profile.skills.length, 4)
    skillScore = Math.min(40, Math.round((skillHits / maxCompare) * 40))
  } else {
    skillScore = 20 // fallback points
  }

  // 3. Education / Certification Bonuses (10 points max)
  let bonusScore = 0
  
  // Education field match (e.g. "nursing" -> 5 points)
  if (profile.educationField) {
    const eduLow = profile.educationField.toLowerCase()
    if (haystack.includes(eduLow) || titleLow.includes(eduLow)) {
      bonusScore += 5
    }
  }

  // Certifications match (e.g. 5 points if any certification word is in description)
  if (profile.certifications.length > 0) {
    const hasCertMatch = profile.certifications.some(cert => {
      const certLow = cert.toLowerCase()
      const words = certLow.split(/\s+/).filter(w => w.length > 4)
      return words.some(w => haystack.includes(w))
    })
    if (hasCertMatch) {
      bonusScore += 5
    }
  }

  const finalScore = Math.min(100, bestRoleScore + skillScore + bonusScore)
  return finalScore
}

/**
 * Asynchronously evaluates match score using Gemini API for high-fidelity evaluation.
 * Falls back to computeMatchScoreFallback if Gemini fails or is unconfigured.
 */
async function computeMatchScore(
  title: string,
  description: string,
  profile: SearchProfile
): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.includes('placeholder') || apiKey.length < 10) {
    return computeMatchScoreFallback(title, description, profile)
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      contents: `Evaluate the match score (percentage) between the user profile and the job listing.

User Profile:
- Target Role: ${profile.role || 'Not specified'}
- Headline: ${profile.headline || 'Not specified'}
- Education Field: ${profile.educationField || 'Not specified'}
- Skills: ${profile.skills.join(', ') || 'None listed'}
- Certifications: ${profile.certifications.join(', ') || 'None listed'}

Job Listing:
- Title: ${title}
- Snippet/Description: ${description}

Rate the match percentage on a scale of 0 to 100.
Be highly intelligent:
- If the candidate is a nurse trainee / assistant and the job is for a nursing/clinical assistant/caregiver, it matches well (score it 70% to 95%).
- If the job requires skills the candidate clearly possesses, score it high.
- If it's a completely unrelated field (e.g. software engineering for a nurse), score it very low (0% to 20%).

Return ONLY a valid JSON object matching this schema: {"score": number, "reasoning": "brief 1-sentence explanation"}.`,
      config: {
        responseMimeType: 'application/json'
      }
    })

    const text = response.text?.trim()
    if (text) {
      const data = JSON.parse(text)
      if (typeof data.score === 'number') {
        console.log(`[Gemini Matcher] "${title}" score: ${data.score}% - Reason: ${data.reasoning || 'No reason provided'}`)
        return Math.min(100, Math.max(0, data.score))
      }
    }
  } catch (err) {
    console.error('[Gemini Matcher] Failed, using fallback:', err)
  }

  return computeMatchScoreFallback(title, description, profile)
}

/** Parse salary hints from DDG snippet text (best-effort) */
function extractSalary(text: string): string | null {
  // Match patterns like $120k, $120,000, $120K–$180K, £80k, etc.
  const salaryRegex = /[\$£€]\s*\d[\d,k.]+(?:\s*[-–—]\s*[\$£€]?\s*\d[\d,k.]+)?(?:\s*(?:k|K|,000))?\s*(?:\/yr|\/year|per year|annually)?/gi
  const match = text.match(salaryRegex)
  return match ? match[0] : null
}

/** Guess job type from snippet — detects remote, hybrid, on-site, contract, etc. */
function extractJobType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('contract')) return 'Contract'
  if (lower.includes('part-time') || lower.includes('part time')) return 'Part-time'
  if (lower.includes('internship') || lower.includes('intern')) return 'Internship'
  if (lower.includes('hybrid')) return 'Hybrid'
  if (lower.includes('remote')) return 'Remote'
  if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('in-office') || lower.includes('on site')) return 'On-site'
  return 'Full-time'
}

/** Guess experience level from snippet/title */
function extractExperienceLevel(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead') || lower.includes('staff') || lower.includes('principal')) return 'Senior'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry')) return 'Junior'
  if (lower.includes('manager') || lower.includes('director') || lower.includes('vp ') || lower.includes('head of')) return 'Manager'
  if (lower.includes('intern')) return 'Internship'
  return 'Mid-level'
}

/** Extract a location hint from description text (best-effort) */
function extractLocation(text: string): string | null {
  if (!text) return null

  // Greenhouse/Lever descriptions typically start with: "Job Title. Location. Apply."
  const sentences = text.split(/[.\n]/).slice(0, 6).map(s => s.trim()).filter(Boolean)

  for (const sentence of sentences) {
    // Exact standalone remote / hybrid
    if (/^remote$/i.test(sentence)) return 'Remote'
    if (/^hybrid$/i.test(sentence)) return 'Hybrid'
    if (/^on-?site$/i.test(sentence)) return 'On-site'

    // "Remote - Region" e.g. "Remote - LATAM"
    if (/^remote\s*[-–—]\s*.+$/i.test(sentence)) return sentence

    // "City (Remote)" or "City (Hybrid)"
    const parenMatch = sentence.match(/^([A-Z][a-zA-Z\s,]+)\s*\(\s*(Remote|Hybrid|On-?site)\s*\)$/i)
    if (parenMatch) return sentence

    // Known countries / regions
    const regionMatch = sentence.match(
      /^(United States|United Kingdom|North America|Europe|LATAM|EMEA|APAC|Canada|UK|Australia|Germany|Nigeria|India|Worldwide|Port Harcourt|Lagos|Abuja)$/i
    )
    if (regionMatch) return regionMatch[0]
  }

  // Fallback — if "remote" or "hybrid" mentioned anywhere
  if (/\bremote\b/i.test(text)) return 'Remote'
  if (/\bhybrid\b/i.test(text)) return 'Hybrid'

  return null
}

/**
 * Returns true if the job's extracted location is acceptable for the user.
 *
 * Rules:
 *  - Remote → always accepted
 *  - Hybrid → always accepted (user can judge)
 *  - On-site / specific city → only accepted if it matches the user's city or country
 *  - null (unknown) → accepted (we can't tell, so we let it through)
 */
function isLocationAcceptable(
  jobLocation: string | null,
  profile: Pick<SearchProfile, 'city' | 'country'>
): boolean {
  if (!jobLocation) return true   // unknown — let it through

  const loc = jobLocation.toLowerCase()

  // Always accept remote / hybrid
  if (/\bremote\b/i.test(loc) || /\bhybrid\b/i.test(loc)) return true

  // For on-site or specific locations, check if user's city or country is mentioned
  const cityMatch  = profile.city    ? loc.includes(profile.city.toLowerCase())    : false
  const countryMatch = profile.country ? loc.includes(profile.country.toLowerCase()) : false

  if (cityMatch || countryMatch) return true

  // Reject — on-site job in a location that doesn't match the user
  console.log(`[isLocationAcceptable] Rejected on-site job location: "${jobLocation}" (user: ${profile.city}, ${profile.country})`)
  return false
}

/** Extract company name from URL path (best-effort; title-cases slug) */
function extractCompanyFromUrl(url: string, platform: JobPlatform): string {
  try {
    const u     = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    // boards.greenhouse.io/<company>/jobs/...  → parts[0]
    // jobs.lever.co/<company>/...             → parts[0]
    // apply.workable.com/<company>/...        → parts[0]
    // wellfound.com/company/<company>/jobs/.. → parts[1]
    const slug = platform === 'wellfound' ? (parts[1] ?? parts[0]) : parts[0]
    return slug
      ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : u.hostname
  } catch {
    return 'Unknown Company'
  }
}

/**
 * Returns true only when the URL looks like a real job listing page,
 * not a company root or search results page.
 *
 * Pattern examples:
 *   boards.greenhouse.io/<co>/jobs/<id>
 *   jobs.lever.co/<co>/<uuid>
 *   apply.workable.com/<co>/j/<id>
 *   wellfound.com/jobs/<id> OR wellfound.com/company/<co>/jobs/<id>
 */
function isDirectJobUrl(url: string, platform: JobPlatform): boolean {
  try {
    const { pathname } = new URL(url)
    const parts = pathname.split('/').filter(Boolean)

    switch (platform) {
      case 'greenhouse':
        // boards.greenhouse.io/<company>/jobs/<id> or job-boards.greenhouse.io/...
        return parts.includes('jobs') && parts.length >= 3
      case 'lever':
        // jobs.lever.co/<company>/<id>
        // Ensure it's not a generic listing index page (length 1)
        return parts.length >= 2
      case 'workable':
        // apply.workable.com/<company>/j/<id> or apply.workable.com/j/<id>
        return parts.length >= 2 && (parts.includes('j') || parts.includes('jobs') || parts.includes('show'))
      case 'wellfound':
        // wellfound.com/jobs/<id> or wellfound.com/company/<co>/jobs/<id>
        return pathname.includes('/jobs/')
      default:
        return true
    }
  } catch {
    return false
  }
}

/** Clean up a title string from DDG (remove trailing " - Company | Platform" patterns) */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[|–—-]\s*(Greenhouse|Lever|Workable|Wellfound|LinkedIn|Indeed).*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

interface JobSearchResult {
  title: string
  url: string
  description: string | null
}

/**
 * Fetch job results using Firecrawl v2 Search API.
 *
 * Payload matches the exact format from the Firecrawl docs:
 *   POST https://api.firecrawl.dev/v2/search
 *   { query, sources: ["web"], categories: [], limit, scrapeOptions: { ... } }
 */
async function fetchJobsWithFirecrawl(query: string): Promise<JobSearchResult[]> {
  const url = 'https://api.firecrawl.dev/v2/search'
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    console.error('[Firecrawl] FIRECRAWL_API_KEY is not set')
    return []
  }

  const payload = {
    query,
    sources: ['web'],
    categories: [],
    limit: MAX_RESULTS_PER_PLATFORM,
    scrapeOptions: {
      onlyMainContent: true,
      maxAge: 172800000, // 48 hours in ms — only return recent pages
      parsers: ['pdf'],
      formats: []        // empty — we only need the structured fields (title, url, description)
    },
  }

  console.log('[Firecrawl] Searching:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error('[Firecrawl] API error:', response.status, data)
      return []
    }

    // Safely extract the results array
    // Firecrawl v2 returns: { success: true, data: { web: [...] } }
    // The results are nested under data.data.web, NOT data.data directly.
    let results: unknown[] = []
    if (data.data?.web && Array.isArray(data.data.web)) {
      results = data.data.web
    } else if (Array.isArray(data.data)) {
      results = data.data
    } else if (Array.isArray(data)) {
      results = data
    }

    if (results.length === 0) {
      console.warn('[Firecrawl] No results for query:', query)
      return []
    }

    console.log(`[Firecrawl] Got ${results.length} raw results`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((item: any) => ({
      title: item.title || item.metadata?.title || 'Unknown Job',
      url: item.url || item.metadata?.sourceURL || '',
      description: item.description || item.metadata?.description || item.markdown || null,
    })).filter((r: JobSearchResult) => r.url !== '')
  } catch (error) {
    console.error('[Firecrawl] Network/fetch error:', error)
    return []
  }
}

// ─── Normalizer (sync — uses fast local scorer, no Gemini calls here) ──────────

function normalizeResult(
  result: JobSearchResult,
  platform: JobPlatform,
  userId: string,
  profile: SearchProfile,
): Omit<JobRow, 'id' | 'applied_status' | 'saved_status' | 'created_at'> | null {
  // Reject results whose URL doesn't look like a real job application page
  if (!isDirectJobUrl(result.url, platform)) {
    console.log(`[normalizeResult] Rejected non-job URL: ${result.url}`)
    return null
  }

  const fullText = `${result.title} ${result.description ?? ''}`
  const title    = cleanTitle(result.title)
  const company  = extractCompanyFromUrl(result.url, platform)
  const description     = result.description ?? null
  const salary          = extractSalary(fullText)
  const job_type        = extractJobType(fullText)
  const experience_level = extractExperienceLevel(fullText)

  // Extract location from description text
  const location = extractLocation(description ?? '')

  // ── Location guard ────────────────────────────────────────────────────
  // Accept: remote, hybrid, unknown, or on-site that matches user's city/country.
  // Reject: on-site jobs from other locations.
  if (!isLocationAcceptable(location, profile)) {
    console.log(`[normalizeResult] Location mismatch — skipping: "${title}" (${location})`)
    return null
  }

  // Tags: all skills found in the listing text
  const tags = profile.skills
    .filter(s => fullText.toLowerCase().includes(s.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))

  const match_score = computeMatchScoreFallback(title, fullText, profile)

  // Drop jobs with a score too low — they don't match the CV
  if (match_score < MIN_MATCH_SCORE) {
    console.log(`[normalizeResult] Low score (${match_score}) for: ${title}`)
    return null
  }

  return {
    user_id: userId,
    platform,
    job_url:    result.url,   // direct link to apply form
    source_url: result.url,
    title,
    company,
    company_logo: null,
    location,
    salary,
    job_type,
    experience_level,
    description,
    tags,
    match_score,
    fetched_at: new Date().toISOString(),
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Parse requested platforms from query string
    const searchParams = req.nextUrl.searchParams
    const platformsParam = searchParams.get('platforms')
    const forceRefresh = searchParams.get('refresh') === '1'

    const requestedPlatforms: JobPlatform[] = platformsParam
      ? (platformsParam.split(',').filter(p =>
          ['greenhouse', 'lever', 'workable', 'wellfound'].includes(p)
        ) as JobPlatform[])
      : ['greenhouse', 'lever', 'workable', 'wellfound']

    // 3. Cache check
    if (!forceRefresh) {
      const { data: latestJob } = await supabase
        .from('jobs')
        .select('fetched_at')
        .eq('user_id', user.id)
        .in('platform', requestedPlatforms)
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (latestJob && latestJob.length > 0) {
        const lastFetchTime = new Date(latestJob[0].fetched_at).getTime()
        const sixHoursAgo = Date.now() - CACHE_HOURS * 60 * 60 * 1000
        
        if (lastFetchTime >= sixHoursAgo) {
          // Cache is valid, return existing jobs
          const { data: cachedJobs, error: cachedError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .in('platform', requestedPlatforms)
            .order('match_score', { ascending: false })
            
          if (!cachedError && cachedJobs) {
            return NextResponse.json({
              jobs: cachedJobs,
              fromCache: true,
              fetchedAt: latestJob[0].fetched_at,
            })
          }
        }
      }
    }

    // 4. Force fresh search — Delete existing saved matches in DB for these platforms to prevent stale/duplicate results (if they aren't manually saved or applied)
    // Actually, we shouldn't delete saved or applied jobs blindly, but for now we follow the existing pattern.
    const serviceClientForDelete = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // We only delete non-saved, non-applied jobs so we don't lose user data.
    await serviceClientForDelete
      .from('jobs')
      .delete()
      .eq('user_id', user.id)
      .in('platform', requestedPlatforms)
      .eq('saved_status', false)
      .eq('applied_status', false)

    // 5. Cache miss — fetch full user profile for rich query building
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, headline, location, skills, work_experience, education, certifications, summary')
      .eq('id', user.id)
      .single()

    // Derive primary role — prefer most recent job title, fall back to headline
    const workExp = Array.isArray(profile?.work_experience) ? profile.work_experience : []
    const latestRole =
      (workExp[0] as { title?: string } | undefined)?.title ??
      profile?.headline ??
      null

    // Determine experience level from number of roles
    const expLevel =
      workExp.length >= 5 ? 'Senior'
      : workExp.length >= 2 ? 'Mid-level'
      : 'Junior'

    // Parse location into city + country
    const rawLocation = profile?.location ?? null
    const { city, country } = parseLocation(rawLocation)

    // Extract education field (e.g. "Computer Science")
    const education = Array.isArray(profile?.education) ? profile.education : []
    const educationField =
      (education[0] as { field?: string } | undefined)?.field ?? null

    // Build the full tech stack from skills (all of them — buildSearchQuery will trim)
    const allSkills = (profile?.skills ?? []) as string[]

    const searchProfile: SearchProfile = {
      role:            latestRole,
      skills:          allSkills,
      techStack:       allSkills,     // techStack mirrors skills — query builder picks top 3
      location:        rawLocation,
      city,
      country,
      headline:        profile?.headline ?? null,
      certifications:  (profile?.certifications ?? []) as string[],
      experienceLevel: expLevel,
      jobType:         null,          // not currently stored in profile; could be added later
      educationField,
    }

    console.log('[/api/jobs] SearchProfile:', JSON.stringify(searchProfile, null, 2))

    // 6. Search Firecrawl for each platform in parallel
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const fetchPromises = requestedPlatforms.map(async (platform) => {
      const query   = buildSearchQuery(platform, searchProfile)
      const results = await fetchJobsWithFirecrawl(query)
      return results
        .map(r => normalizeResult(r, platform, user.id, searchProfile))
        .filter((r): r is Exclude<typeof r, null> => r !== null)  // drop low-score / bad-url results
    })

    const nestedResults = await Promise.allSettled(fetchPromises)
    const freshJobs: Array<Omit<JobRow, 'id' | 'applied_status' | 'saved_status' | 'created_at'>> = []

    for (const result of nestedResults) {
      if (result.status === 'fulfilled') {
        freshJobs.push(...result.value)
      } else {
        console.error('Platform fetch failed:', result.reason)
      }
    }

    if (freshJobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        fromCache: false,
        fetchedAt: new Date().toISOString(),
        error: 'No jobs found. Try broadening your profile (role, skills, or location).',
      })
    }

    // 7. Re-score top candidates with Gemini (rate-limited to avoid 429)
    // We only call Gemini for the top N locally-scored jobs, sequentially with a delay.
    const GEMINI_MAX_RESCORES = 5
    const GEMINI_CALL_DELAY_MS = 2000 // 2 seconds between calls → max 5 calls = safe under 15 RPM

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey && !geminiApiKey.includes('placeholder') && geminiApiKey.length >= 10) {
      // Sort by local score descending, take top N for re-scoring
      const topCandidateIndexes = freshJobs
        .map((j, i) => ({ i, score: j.match_score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, GEMINI_MAX_RESCORES)
        .map(x => x.i)

      console.log(`[Gemini] Re-scoring top ${topCandidateIndexes.length} candidates sequentially...`)

      for (const idx of topCandidateIndexes) {
        const job = freshJobs[idx]
        try {
          const geminiScore = await computeMatchScore(
            job.title,
            job.description ?? '',
            searchProfile
          )
          freshJobs[idx] = { ...job, match_score: geminiScore }
        } catch {
          // Keep local score on failure
        }
        // Wait between calls to stay within rate limits
        await new Promise(resolve => setTimeout(resolve, GEMINI_CALL_DELAY_MS))
      }
    }

    // 8. Delete stale records again (just in case), then upsert fresh ones
    // We only delete non-saved/non-applied records to prevent duplication of new entries vs old.
    // Wait, we already deleted at step 4. So we don't need to delete again here.
    // We'll just do the insert.

    const { data: upserted, error: insertError } = await serviceClient
      .from('jobs')
      .insert(freshJobs)
      .select()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: `DB error: ${insertError.message}` }, { status: 500 })
    }

    const sortedJobs = (upserted ?? []).sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))

    return NextResponse.json({
      jobs: sortedJobs,
      fromCache: false,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/jobs GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── PATCH Handler — update saved_status / applied_status ────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json() as { id: string; saved_status?: boolean; applied_status?: boolean }
    if (!body.id) return NextResponse.json({ error: 'Missing job id.' }, { status: 400 })

    const updates: Partial<Pick<JobRow, 'saved_status' | 'applied_status'>> = {}
    if (typeof body.saved_status === 'boolean') updates.saved_status = body.saved_status
    if (typeof body.applied_status === 'boolean') updates.applied_status = body.applied_status

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
