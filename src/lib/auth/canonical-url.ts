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

export function canonicalAppUrl(
  path: string,
  query?: Record<string, string | undefined>
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, CANONICAL_APP_ORIGIN)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }
  return url.toString()
}

/** Redirect target that may include its own query string, e.g. /pricing?plan=explorer */
export function canonicalAppPath(pathWithQuery: string): string {
  return new URL(pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`, CANONICAL_APP_ORIGIN).toString()
}

export function isCanonicalProductionHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''
  if (hostname === 'www.driftpass.com.au') return true
  if (hostname.startsWith('localhost') || hostname === '127.0.0.1') return true
  return false
}

export function toCanonicalProductionUrl(pathname: string, search: string): string {
  return `${PRODUCTION_APP_ORIGIN}${pathname}${search}`
}
