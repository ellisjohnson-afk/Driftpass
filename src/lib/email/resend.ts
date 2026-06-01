import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = `${process.env.RESEND_FROM_NAME ?? 'DriftPass'} <${process.env.RESEND_FROM_EMAIL ?? 'hello@driftpass.com.au'}>`

// ============================================================
// Email Templates
// Keep HTML inline for simplicity. Use react-email for Phase 4.
// ============================================================

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  planName: string
  credits: number
}) {
  const { to, name, planName, credits } = params

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to DriftPass, ${name}! 🌊`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0A0A0A;color:#ffffff;border-radius:12px;">
        <h1 style="color:#00FF7F;font-size:28px;margin-bottom:8px;">Welcome to DriftPass</h1>
        <p style="color:#9CA3AF;margin-bottom:24px;">Drift further. Spend less.</p>
        <p>Hey ${name},</p>
        <p>You're now on the <strong>${planName}</strong> plan with <strong>${credits} credits</strong> to spend this month.</p>
        <p>Your digital pass is ready to use at any DriftPass partner. Open the app, show your QR code, and you're in.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pass"
           style="display:inline-block;background:#00FF7F;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:24px 0;">
          View My Pass
        </a>
        <p style="color:#6B7280;font-size:14px;margin-top:32px;">
          Questions? Reply to this email — we're a small team and we actually respond.<br>
          hello@driftpass.com.au
        </p>
      </div>
    `,
  })
}

export async function sendPassDeliveryEmail(params: {
  to: string
  name: string
  passUrl: string
}) {
  const { to, name, passUrl } = params

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your DriftPass is ready',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0A0A0A;color:#ffffff;border-radius:12px;">
        <h1 style="color:#00FF7F;">Your Pass is Ready</h1>
        <p>Hey ${name}, your DriftPass digital pass is ready to use.</p>
        <a href="${passUrl}" style="display:inline-block;background:#00FF7F;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
          Open My Pass
        </a>
        <p style="color:#6B7280;font-size:14px;margin-top:32px;">
          Show the QR code at any DriftPass partner to redeem your credits.
        </p>
      </div>
    `,
  })
}

export async function sendSubscriptionCanceledEmail(params: {
  to: string
  name: string
}) {
  const { to, name } = params

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your DriftPass subscription has ended',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0A0A0A;color:#ffffff;border-radius:12px;">
        <h1 style="color:#ffffff;">We'll miss you, ${name}</h1>
        <p>Your DriftPass subscription has been canceled. You can resubscribe any time.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
           style="display:inline-block;background:#00FF7F;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:24px 0;">
          Rejoin DriftPass
        </a>
        <p style="color:#6B7280;font-size:14px;">Drift further. Spend less.</p>
      </div>
    `,
  })
}

export async function sendRedemptionConfirmationEmail(params: {
  to: string
  name: string
  serviceName: string
  partnerName: string
  creditsUsed: number
  creditsRemaining: number
}) {
  const { to, name, serviceName, partnerName, creditsUsed, creditsRemaining } = params

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${creditsUsed} credits used at ${partnerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0A0A0A;color:#ffffff;border-radius:12px;">
        <h1 style="color:#00FF7F;">${creditsUsed} credits used</h1>
        <p>Hey ${name}, here's your redemption summary:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="color:#9CA3AF;padding:8px 0;">Service</td><td style="font-weight:600;">${serviceName}</td></tr>
          <tr><td style="color:#9CA3AF;padding:8px 0;">Partner</td><td style="font-weight:600;">${partnerName}</td></tr>
          <tr><td style="color:#9CA3AF;padding:8px 0;">Credits used</td><td style="font-weight:600;">${creditsUsed}</td></tr>
          <tr><td style="color:#9CA3AF;padding:8px 0;">Credits remaining</td><td style="font-weight:600;color:#00FF7F;">${creditsRemaining}</td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display:inline-block;background:#00FF7F;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
          View Dashboard
        </a>
      </div>
    `,
  })
}
