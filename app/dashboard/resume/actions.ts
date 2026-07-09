'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteResume(id: string, storagePath: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError || !resume || resume.user_id !== user.id) {
    throw new Error('Not authorized to delete this resume')
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)

  if (dbError) {
    throw new Error('Failed to delete resume record')
  }

  // Delete from storage
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([storagePath])

    if (storageError) {
      console.error('Failed to delete resume file from storage:', storageError)
    }
  }

  revalidatePath('/dashboard/resume')
}
