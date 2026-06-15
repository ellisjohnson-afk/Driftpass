import 'server-only'

import { headers } from 'next/headers'
import { resolveAppOrigin } from '@/lib/auth/canonical-url'

export async function getServerAppOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const requestOrigin = host ? `${proto}://${host}` : undefined
  return resolveAppOrigin(host, requestOrigin)
}
