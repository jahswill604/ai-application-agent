import { GoogleGenAI } from '@google/genai'
import { ExtractedProfileSchema, type ExtractedProfile } from '@/types/profile'

/**
 * Extracts structured resume data from raw text.
 *
 * @returns A result containing the extracted profile data, a success flag, a partial flag, and an error message when extraction fails.
 */
export async function extractResumeData(
  rawText: string
): Promise<{ data: ExtractedProfile; success: boolean; error?: string; isPartial: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || apiKey.includes('placeholder')) {
    return {
      success: false,
      isPartial: true,
      error: 'GEMINI_API_KEY is not configured in .env.local',
      data: getEmptyProfile(),
    }
  }

  const ai = new GoogleGenAI({ apiKey })

  const buildPrompt = (text: string, isRetry = false) => `${isRetry
    ? 'IMPORTANT: The previous extraction failed. Return ONLY valid JSON. No markdown, no backticks, no explanation — just the raw JSON object.\n\n'
    : ''
    }You are an expert HR assistant and resume parser. Your job is to extract every piece of useful information from the resume below and return it as a structured JSON object.

Be thorough — extract ALL skills mentioned anywhere in the CV (from skills sections, job descriptions, project details, etc.). Capture full bullet-point descriptions for work experience. Extract any URLs, social links, or portfolio links found.

Return ONLY the JSON object below — no markdown fences, no extra text.

JSON STRUCTURE TO RETURN:
{
  "full_name": "Full name of the person, or null",
  "headline": "Professional title or role (e.g. 'Senior Software Engineer'), or null",
  "email": "Email address found in the CV, or null",
  "phone": "Phone number, or null",
  "location": "City, Country (e.g. 'Lagos, Nigeria'), or null",
  "summary": "Professional summary or objective paragraph. If not present, write a 2-3 sentence summary from the CV content, or null",
  "skills": [
    "List every technical skill, tool, framework, language, and soft skill mentioned anywhere in the CV"
  ],
  "work_experience": [
    {
      "company": "Employer name",
      "title": "Job title",
      "start": "Month Year or Year (e.g. 'Jan 2020'), or null",
      "end": "Month Year, Year, or 'Present', or null",
      "description": "Full description: responsibilities, achievements, and technologies used. Include bullet points as a single string, separated by newlines."
    }
  ],
  "education": [
    {
      "school": "University or school name",
      "degree": "Degree type (e.g. 'Bachelor of Science', 'HND'), or null",
      "field": "Field of study (e.g. 'Computer Science'), or null",
      "start": "Year or null",
      "end": "Year or null"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "What it does, the tech stack used, and any measurable outcomes"
    }
  ],
  "certifications": [
    "List each certification, course, or professional qualification as a string"
  ],
  "contact_details": {
    "linkedin": "Full LinkedIn profile URL if found (e.g. 'https://linkedin.com/in/username'), or null",
    "github": "Full GitHub profile URL if found (e.g. 'https://github.com/username'), or null",
    "website": "Personal website or portfolio URL if found, or null",
    "languages": ["List of spoken/written languages mentioned in the CV"]
  }
}

RESUME TEXT TO PARSE:
---
${text}
---`

  let attempt = 1

  while (attempt <= 2) {
    try {
      const result = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
        contents: buildPrompt(rawText, attempt === 2),
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      })

      const outputText = result.text ?? ''
      let cleanedText = outputText.trim()

      // Strip markdown fences if returned despite responseMimeType setting
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim()
      }

      if (!cleanedText) {
        throw new Error('Received empty response from Gemini.')
      }

      const parsedJSON = JSON.parse(cleanedText)
      const validationResult = ExtractedProfileSchema.safeParse(parsedJSON)

      if (validationResult.success) {
        return {
          success: true,
          isPartial: false,
          data: validationResult.data,
        }
      } else {
        console.warn(
          `Extraction validation failed (Attempt ${attempt}):`,
          validationResult.error.flatten()
        )
        throw new Error(`JSON schema mismatch: ${validationResult.error.message}`)
      }
    } catch (err: any) {
      console.error(`Resume extraction error (Attempt ${attempt}):`, err?.message ?? err)

      if (attempt === 1) {
        attempt++
        // Retry with stricter instructions
      } else {
        return {
          success: false,
          isPartial: true,
          error: `AI extraction failed after 2 attempts: ${err?.message ?? String(err)}`,
          data: getEmptyProfile(),
        }
      }
    }
  }

  return {
    success: false,
    isPartial: true,
    error: 'Unknown extraction failure.',
    data: getEmptyProfile(),
  }
}

/**
 * Creates an empty resume profile.
 *
 * @returns A fully shaped `ExtractedProfile` with `null` values and empty arrays.
 */
function getEmptyProfile(): ExtractedProfile {
  return {
    full_name: null,
    headline: null,
    email: null,
    phone: null,
    location: null,
    summary: null,
    skills: [],
    work_experience: [],
    education: [],
    projects: [],
    certifications: [],
    contact_details: {
      linkedin: null,
      github: null,
      website: null,
      languages: [],
    },
  }
}
