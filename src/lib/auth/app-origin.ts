import { CANONICAL_APP_ORIGIN } from '@/lib/auth/canonical-url'

/** Always return the canonical app origin — never infer from request headers. */
export function getAppOrigin(_req?: Request): string {
  return CANONICAL_APP_ORIGIN
}
