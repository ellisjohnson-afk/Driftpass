/** Production canonical origin — never driftpass.vercel.app (breaks OAuth PKCE state). */
export const PRODUCTION_APP_ORIGIN = 'https://www.driftpass.com.au'

/**
 * Canonical origin for auth/payment redirects.
 * Production builds always use www.driftpass.com.au regardless of Vercel env.
 */
export const CANONICAL_APP_ORIGIN = (
  process.env.NODE_ENV === 'development'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    : PRODUCTION_APP_ORIGIN
).replace(/\/$/, '')

export function isLocalDevHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/** Use the request origin on localhost in dev; otherwise canonical production origin. */
export function resolveAppOrigin(host: string | null | undefined, requestOrigin?: string): string {
  if (process.env.NODE_ENV === 'development' && host && isLocalDevHost(host)) {
    return (requestOrigin ?? `http://${host}`).replace(/\/$/, '')
  }
  return CANONICAL_APP_ORIGIN
}

export function appUrlAt(
  origin: string,
  path: string,
  query?: Record<string, string | undefined>
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }
  return url.toString()
}

export function canonicalAppUrl(
  path: string,
  query?: Record<string, string | undefined>
): string {
  return appUrlAt(CANONICAL_APP_ORIGIN, path, query)
}

/** Redirect target that may include its own query string, e.g. /pricing?plan=explorer */
export function canonicalAppPath(pathWithQuery: string): string {
  return appUrlAt(CANONICAL_APP_ORIGIN, pathWithQuery)
}

export function appPathAt(origin: string, pathWithQuery: string): string {
  return appUrlAt(origin, pathWithQuery)
}

export function isCanonicalProductionHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''
  if (hostname === 'www.driftpass.com.au') return true
  if (isLocalDevHost(host)) return true
  return false
}

export function toCanonicalProductionUrl(pathname: string, search: string): string {
  return `${PRODUCTION_APP_ORIGIN}${pathname}${search}`
}
