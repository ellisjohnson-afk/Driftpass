import type { NextRequest } from 'next/server'
import { resolveAppOrigin } from '@/lib/auth/canonical-url'

export function getAppOriginFromRequest(request: NextRequest): string {
  return resolveAppOrigin(request.headers.get('host'), request.nextUrl.origin)
}

/** Browser-only — uses the page origin (localhost:3004, www.driftpass.com.au, etc.). */
export function getClientAppOrigin(): string {
  if (typeof window === 'undefined') {
    throw new Error('getClientAppOrigin() is client-only')
  }
  return window.location.origin
}
