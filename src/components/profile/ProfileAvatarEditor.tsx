'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileAvatar } from './ProfileAvatar'
import { cn } from '@/lib/utils/cn'

export interface ProfileAvatarEditorProps {
  name: string
  avatarUrl?: string | null
  className?: string
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="14" r="3.25" />
    </svg>
  )
}

export function ProfileAvatarEditor({ name, avatarUrl, className }: ProfileAvatarEditorProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)

    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch('/api/profile/avatar', { method: 'POST', body })
      const data = (await res.json()) as { avatarUrl?: string; error?: string }

      if (!res.ok) {
        setPreviewUrl(null)
        setError(data.error ?? 'Upload failed')
        return
      }

      setPreviewUrl(data.avatarUrl ?? null)
      router.refresh()
    } catch {
      setPreviewUrl(null)
      setError('Upload failed. Check your connection.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('relative mx-auto w-fit', className)}>
      <ProfileAvatar name={name} avatarUrl={previewUrl ?? avatarUrl} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-drift-gold-to/50 bg-drift-gold-gradient text-drift-navy-deep shadow-drift-card transition-transform hover:scale-105 disabled:opacity-60"
        aria-label="Change profile photo"
      >
        <CameraIcon />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />

      {uploading ? (
        <p className="mt-2 text-center text-xs text-drift-text-muted">Uploading…</p>
      ) : null}
      {error ? <p className="mt-2 text-center text-xs text-red-400">{error}</p> : null}
      {!uploading && !error ? (
        <p className="mt-2 text-center text-xs text-drift-text-muted">Tap to change photo</p>
      ) : null}
    </div>
  )
}
