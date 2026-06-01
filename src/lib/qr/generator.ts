import { createHmac, randomBytes } from 'crypto'
import type { PassToken } from '@/types'

// ============================================================
// QR Pass Token System
// Each scan generates a short-lived signed token (30s TTL).
// The token contains: userId, subscriptionId, timestamp, nonce.
// Partner scan page verifies the signature and TTL server-side.
// ============================================================

const SECRET = process.env.PIN_HMAC_SECRET
if (!SECRET) throw new Error('PIN_HMAC_SECRET env var is required but not set')

const TOKEN_TTL_MS = 30_000  // 30 seconds

// Sign a token using HMAC-SHA256
function signToken(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

// Generate a new QR token for a subscriber
export function generatePassToken(userId: string, subscriptionId: string): string {
  const nonce = randomBytes(8).toString('hex')
  const now = Date.now()
  const payload: PassToken = {
    userId,
    subscriptionId,
    generatedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    nonce,
  }

  const payloadStr = JSON.stringify(payload)
  const sig = signToken(payloadStr)
  const token = Buffer.from(JSON.stringify({ payload: payloadStr, sig })).toString('base64url')
  return token
}

// Verify a QR token. Returns the payload or throws.
export function verifyPassToken(token: string): PassToken {
  let parsed: { payload: string; sig: string }

  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as {
      payload: string
      sig: string
    }
  } catch {
    throw new InvalidTokenError('Token is malformed')
  }

  const expectedSig = signToken(parsed.payload)
  if (expectedSig !== parsed.sig) {
    throw new InvalidTokenError('Token signature invalid')
  }

  const payload = JSON.parse(parsed.payload) as PassToken

  if (Date.now() > payload.expiresAt) {
    throw new ExpiredTokenError()
  }

  return payload
}

// ============================================================
// 6-digit PIN System
// PIN rotates every 60 seconds. Derived from HMAC so it's
// deterministic — server can verify without storing it.
// Two windows accepted (current + previous) to handle edge cases.
//
// Fast lookup: first 2 digits are a stable user shard (derived
// from userId only, not time). The API uses this to pre-filter
// subscriptions before checking the full PIN.
// ============================================================

const PIN_WINDOW_MS = 60_000  // 60 seconds

function pinWindow(offsetWindows = 0): number {
  return Math.floor(Date.now() / PIN_WINDOW_MS) + offsetWindows
}

// Stable 2-digit shard derived from userId (doesn't rotate)
export function userPinShard(userId: string): string {
  const hmac = createHmac('sha256', SECRET)
  hmac.update(`shard:${userId}`)
  const num = parseInt(hmac.digest('hex').slice(0, 4), 16) % 100
  return num.toString().padStart(2, '0')
}

// Generate a 6-digit PIN: first 2 = stable shard, last 4 = rotating
function pinForWindow(userId: string, subscriptionId: string, window: number): string {
  const shard = userPinShard(userId)
  const hmac = createHmac('sha256', SECRET)
  hmac.update(`${userId}:${subscriptionId}:${window}`)
  const num = parseInt(hmac.digest('hex').slice(0, 6), 16) % 10_000
  return shard + num.toString().padStart(4, '0')
}

export function generatePassPIN(userId: string, subscriptionId: string): string {
  return pinForWindow(userId, subscriptionId, pinWindow())
}

export function pinExpiresInMs(): number {
  return PIN_WINDOW_MS - (Date.now() % PIN_WINDOW_MS)
}

export function verifyPassPIN(pin: string, userId: string, subscriptionId: string): boolean {
  // Accept 3 windows (3 minutes) to handle compilation delays and slow networks
  return [-2, -1, 0].some(offset =>
    pin === pinForWindow(userId, subscriptionId, pinWindow(offset))
  )
}

// Generate QR code as a data URL (server-side, for pass page)
export async function generateQRDataURL(token: string): Promise<string> {
  const QRCode = await import('qrcode')
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${token}`

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#0A0A0A',
      light: '#FFFFFF',
    },
  })
}

// ---- Custom Errors ----
export class InvalidTokenError extends Error {
  constructor(reason: string) {
    super(`Invalid pass token: ${reason}`)
    this.name = 'InvalidTokenError'
  }
}

export class ExpiredTokenError extends Error {
  constructor() {
    super('Pass token has expired — refresh your pass')
    this.name = 'ExpiredTokenError'
  }
}
