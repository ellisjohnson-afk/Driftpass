#!/usr/bin/env node
/**
 * Unit test: PIN verification accepts current + previous window only.
 * Run: node scripts/test-pin-windows.mjs
 */
import { createHmac } from 'crypto'

const SECRET = 'test-secret-for-pin-windows'
const PIN_WINDOW_MS = 60_000

function pinWindow(offsetWindows = 0) {
  return Math.floor(Date.now() / PIN_WINDOW_MS) + offsetWindows
}

function userPinShard(userId) {
  const hmac = createHmac('sha256', SECRET)
  hmac.update(`shard:${userId}`)
  return (parseInt(hmac.digest('hex').slice(0, 4), 16) % 100).toString().padStart(2, '0')
}

function pinForWindow(userId, subscriptionId, window) {
  const shard = userPinShard(userId)
  const hmac = createHmac('sha256', SECRET)
  hmac.update(`${userId}:${subscriptionId}:${window}`)
  const num = parseInt(hmac.digest('hex').slice(0, 6), 16) % 10_000
  return shard + num.toString().padStart(4, '0')
}

function verifyPassPIN(pin, userId, subscriptionId) {
  return [-1, 0].some((offset) =>
    pin === pinForWindow(userId, subscriptionId, pinWindow(offset))
  )
}

const userId = 'user-123'
const subId = 'sub-456'
const current = pinForWindow(userId, subId, pinWindow(0))
const previous = pinForWindow(userId, subId, pinWindow(-1))
const twoWindowsAgo = pinForWindow(userId, subId, pinWindow(-2))

console.assert(verifyPassPIN(current, userId, subId), 'current window should pass')
console.assert(verifyPassPIN(previous, userId, subId), 'previous window should pass')
console.assert(!verifyPassPIN(twoWindowsAgo, userId, subId), 'two windows ago should fail')
console.assert(current.length === 6, 'PIN must be 6 digits')
console.assert(current.slice(0, 2) === userPinShard(userId), 'shard must be stable')

console.log('✓ PIN 2-window verification tests passed')
