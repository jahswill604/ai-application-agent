import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import mammoth from 'mammoth'
import { ExtractedProfileSchema } from '@/types/profile'

const EXTRACTION_PROMPT = `You are an expert HR assistant and resume parser. Extract every piece of information from this resume and return it as a single valid JSON object.

Be thorough — extract ALL skills (from skills sections, job descriptions, project details, etc.). Capture full descriptions for work experience. Extract any URLs, social links, or portfolio links.

Return ONLY the JSON object below — no markdown fences, no extra text, no explanation.

JSON STRUCTURE:
{
  "full_name": "Full name of the person, or null",
  "headline": "Professional title or role (e.g. 'Senior Software Engineer'), or null",
  "email": "Email address found in the CV, or null",
  "phone": "Phone number, or null",
  "location": "City, Country (e.g. 'Lagos, Nigeria'), or null",
  "summary": "Professional summary or objective. If not present, write a 2-3 sentence summary from the CV content.",
  "skills": ["List every technical skill, tool, framework, language, and soft skill mentioned anywhere in the CV"],
  "work_experience": [
    {
      "company": "Employer name",
      "title": "Job title",
      "start": "Month Year or Year (e.g. 'Jan 2020'), or null",
      "end": "Month Year, Year, or 'Present', or null",
      "description": "Full description with responsibilities, achievements, and technologies used."
    }
  ],
  "education": [
    {
      "school": "University or school name",
      "degree": "Degree type (e.g. 'Bachelor of Science'), or null",
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
  "certifications": ["List each certification or professional qualification as a string"],
  "contact_details": {
    "linkedin": "Full LinkedIn profile URL if found, or null",
    "github": "Full GitHub profile URL if found, or null",
    "website": "Personal website or portfolio URL if found, or null",
    "languages": ["List of spoken/written languages mentioned in the CV"]
  }
}`

/**
 * Processes an authenticated resume upload, extracts structured profile data, and stores the file and results.
 *
 * @param req - The incoming request containing the uploaded resume file in `multipart/form-data`.
 * @returns A JSON response indicating success or an error status.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const isPDF =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isDOCX =
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')

    if (!isPDF && !isDOCX) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and DOCX are allowed.' },
        { status: 400 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    let contents: any

    if (isPDF) {
      // Send PDF directly to Gemini as inline base64 data — no text extraction needed!
      const base64PDF = buffer.toString('base64')
      contents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64PDF,
          },
        },
        { text: EXTRACTION_PROMPT },
      ]
    } else {
      // DOCX: extract text with mammoth then pass as text
      const result = await mammoth.extractRawText({ buffer })
      const extractedText = result.value

      if (!extractedText || !extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from the DOCX file.' },
          { status: 400 }
        )
      }

      contents = `${EXTRACTION_PROMPT}\n\nRESUME TEXT TO PARSE:\n---\n${extractedText.substring(0, 30000)}\n---`
    }

    // Call Gemini with up to 2 attempts
    let parsedData: Record<string, any> = {}
    let parseSuccess = false

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        })

        let outputText = geminiResponse.text ?? ''
        outputText = outputText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim()

        if (!outputText) throw new Error('Empty response from Gemini.')

        parsedData = JSON.parse(outputText)
        parseSuccess = true
        break
      } catch (err: any) {
        console.error(`Gemini extraction attempt ${attempt} failed:`, err?.message ?? err)
        if (attempt === 2) {
          return NextResponse.json(
            { error: `AI extraction failed: ${err?.message ?? 'Unknown error'}` },
            { status: 500 }
          )
        }
      }
    }

    if (!parseSuccess) {
      return NextResponse.json({ error: 'Failed to parse resume data.' }, { status: 500 })
    }

    // Upload raw file to Supabase Storage
    const fileExtension = file.name.split('.').pop()
    const safeFileName = `${Date.now()}_${user.id}.${fileExtension}`
    const storagePath = `${user.id}/${safeFileName}`

    const { error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return NextResponse.json(
        {
          error:
            'Failed to upload file to storage. Have you created the "resumes" bucket in Supabase?',
        },
        { status: 500 }
      )
    }

    // Insert into resumes table
    const { error: resumeDbError } = await supabase.from('resumes').insert({
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      file_size_bytes: file.size,
      mime_type: file.type,
    })

    if (resumeDbError) {
      console.error('Resume DB insert error:', resumeDbError)
    }

    // Update profiles table with extracted data
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        full_name: parsedData.full_name ?? null,
        headline: parsedData.headline ?? null,
        phone: parsedData.phone ?? null,
        location: parsedData.location ?? null,
        summary: parsedData.summary ?? null,
        skills: parsedData.skills ?? [],
        work_experience: parsedData.work_experience ?? [],
        education: parsedData.education ?? [],
        projects: parsedData.projects ?? [],
        certifications: parsedData.certifications ?? [],
        contact_details: parsedData.contact_details ?? {},
        resume_uploaded: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError)
      return NextResponse.json(
        { error: 'Failed to save profile data to database.' },
        { status: 500 }
      )
    }

    const isPartial =
      !parsedData.full_name ||
      !parsedData.work_experience ||
      parsedData.work_experience.length === 0

    return NextResponse.json({ success: true, isPartial, profile: parsedData })
  } catch (error: any) {
    console.error('Resume upload/parse error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
