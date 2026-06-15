#!/usr/bin/env node
/**
 * Ensure avatars storage bucket exists.
 * Apply storage policies from supabase/migrations/007_profile_avatars_storage.sql in SQL editor.
 *
 * Run: npm run db:apply-007
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).split(' ')[0]
  }
  return env
}

const env = loadEnv()
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!baseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

const bucketPayload = {
  id: 'avatars',
  name: 'avatars',
  public: true,
  file_size_limit: 5 * 1024 * 1024,
  allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}

const createRes = await fetch(`${baseUrl}/storage/v1/bucket`, {
  method: 'POST',
  headers,
  body: JSON.stringify(bucketPayload),
})

if (createRes.ok) {
  console.log('✓ avatars storage bucket created')
} else {
  const body = await createRes.text()
  if (body.toLowerCase().includes('already exists')) {
    console.log('✓ avatars storage bucket already exists')
  } else {
    console.error('Bucket create failed:', createRes.status, body)
    process.exit(1)
  }
}

console.log('→ Apply supabase/migrations/007_profile_avatars_storage.sql in Supabase SQL editor for RLS policies.')
