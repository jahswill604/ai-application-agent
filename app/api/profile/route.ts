import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExtractedProfileSchema } from '@/types/profile'

/**
 * Updates the authenticated user's profile.
 *
 * Validates the request body against `ExtractedProfileSchema` and stores the
 * profile fields for the current user. Returns `401` when the request is not
 * authenticated, `400` when validation fails, `500` when the update fails or an
 * unexpected error occurs, and `200` with the updated profile on success.
 *
 * @param req - The incoming request.
 * @returns A JSON response containing the update result.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await req.json()

    // 3. Validate matching schema (use partial or allow partial updates if needed, 
    // but here we validate it according to ExtractedProfileSchema)
    const validationResult = ExtractedProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Validation failed: ${validationResult.error.message}` },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // 4. Update profiles table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: validatedData.full_name,
        headline: validatedData.headline,
        email: validatedData.email,
        phone: validatedData.phone,
        location: validatedData.location,
        summary: validatedData.summary,
        skills: validatedData.skills,
        work_experience: validatedData.work_experience,
        education: validatedData.education,
        projects: validatedData.projects,
        certifications: validatedData.certifications,
        profile_completed: true, // mark as completed on manual save/update
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (err: any) {
    console.error('Server error updating profile:', err)
    return NextResponse.json(
      { error: `Server error: ${err.message || err}` },
      { status: 500 }
    )
  }
}

/**
 * Fetches the authenticated user's profile.
 *
 * @param req - The incoming request.
 * @returns A JSON response containing the user's profile, or an error response if authentication or retrieval fails.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Fetch profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
