// ============================================================
// DriftPass Push Notifications (Phase 3)
// OneSignal wrapper. Stubs work now — add API keys to activate.
// ============================================================

interface PushPayload {
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
}

// Send to a specific user by their OneSignal player ID (push_token)
export async function sendPushToUser(
  playerIds: string[],
  payload: PushPayload
): Promise<void> {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
    console.log('[Push] Not configured — skipping:', payload.title)
    return
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.url,
      data: payload.data,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Push] OneSignal error:', error)
  }
}

// Broadcast to all subscribers in a city (location segment)
export async function sendPushToCity(
  city: string,
  payload: PushPayload
): Promise<void> {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
    console.log('[Push] Not configured — skipping broadcast to', city)
    return
  }

  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      filters: [{ field: 'tag', key: 'city', relation: '=', value: city }],
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.url,
      data: payload.data,
    }),
  })
}

// Flash deal notification — sent to users within 10km
export async function sendFlashDealNotification(params: {
  playerIds: string[]
  dealTitle: string
  partnerName: string
  dealId: string
  seatsRemaining: number
}) {
  await sendPushToUser(params.playerIds, {
    title: `⚡ Flash Deal — ${params.partnerName}`,
    body: `${params.dealTitle} · ${params.seatsRemaining} seats left`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/flash?deal=${params.dealId}`,
    data: { type: 'flash_deal', dealId: params.dealId },
  })
}

// Slow hour deal notification
export async function sendSlowHourNotification(params: {
  playerIds: string[]
  partnerName: string
  serviceName: string
  partnerId: string
}) {
  await sendPushToUser(params.playerIds, {
    title: `${params.partnerName} is quiet right now`,
    body: `${params.serviceName} available — no wait, use your credits`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/explore`,
    data: { type: 'slow_hour', partnerId: params.partnerId },
  })
}
