'use client'

import React, { useTransition } from 'react'
import { deleteResume } from '../actions'

interface DeleteResumeButtonProps {
  id: string
  storagePath: string
}

export default function DeleteResumeButton({ id, storagePath }: DeleteResumeButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this resume?')) return
    
    startTransition(async () => {
      try {
        await deleteResume(id, storagePath)
      } catch (err: any) {
        alert(err.message || 'Failed to delete resume')
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="h-11 px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all flex items-center justify-center border border-red-200 disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
