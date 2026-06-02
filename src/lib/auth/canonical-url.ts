/** Single canonical origin for all auth and payment redirects in production. */
export const CANONICAL_APP_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.driftpass.com.au'
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
