import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function extensionForType(type: string): string {
  switch (type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Use a JPEG, PNG, WebP, or GIF image' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })
  }

  const ext = extensionForType(file.type)
  const objectPath = `${user.id}/avatar.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage.from('avatars').upload(objectPath, bytes, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })

  if (uploadError) {
    console.error('[Avatar] upload failed', uploadError)
    return NextResponse.json(
      { error: 'Could not upload image. Try again in a moment.' },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('avatars').getPublicUrl(objectPath)

  const avatarUrl = `${publicUrl}?v=${Date.now()}`

  const { error: profileError } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (profileError) {
    console.error('[Avatar] profile update failed', profileError)
    return NextResponse.json({ error: 'Upload saved but profile could not update' }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: files } = await admin.storage.from('avatars').list(user.id)
  if (files?.length) {
    const paths = files.map((file) => `${user.id}/${file.name}`)
    await admin.storage.from('avatars').remove(paths)
  }

  await admin.from('profiles').update({ avatar_url: null }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
