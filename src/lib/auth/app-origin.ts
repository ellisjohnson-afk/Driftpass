/** Resolve the public app origin from an incoming request (matches the user's browser host). */
export function getAppOrigin(req: Request): string {
  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      // ignore malformed referer
    }
  }

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host.split(',')[0]?.trim()}`.replace(/\/$/, '')

  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}
