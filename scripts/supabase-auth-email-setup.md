# Supabase auth emails — Resend SMTP setup

Auth emails (signup confirm, password reset) are sent by **Supabase Auth**, not the Next.js app.
The app already uses Resend for welcome/redemption emails — wire the same domain into Supabase SMTP.

## 1. Verify Resend domain

1. Log in at [resend.com](https://resend.com)
2. **Domains** → add `driftpass.com.au` (or your sending domain)
3. Add the DNS records Resend shows (DKIM, SPF, MX on the `send` subdomain)
4. Wait until status is **Verified**

Sender address must use that domain, e.g. `hello@driftpass.com.au`.

## 2. Connect Resend SMTP in Supabase

1. Open [Supabase project](https://supabase.com/dashboard/project/kxutuhifihgogrervsve)
2. **Authentication** → **Email** (under Notifications)
3. Enable **Custom SMTP**
4. Enter:

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key (`re_...` from `.env.local`) |
| Sender email | `hello@driftpass.com.au` |
| Sender name | `DriftPass` |

5. Click **Save**

No trailing spaces on the host field — that breaks DNS lookup.

## 3. Auth URL configuration (required)

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://www.driftpass.com.au` |
| Redirect URLs | See list below |

Add **all** of these redirect URLs:

```
https://www.driftpass.com.au/callback
https://www.driftpass.com.au/callback/**
https://www.driftpass.com.au/reset-password
https://driftpass.com.au/callback
http://localhost:3000/callback
http://localhost:3000/callback/**
http://localhost:3004/callback
http://localhost:3004/callback/**
```

The `callback/**` wildcard is **required** for password-reset links (`/callback?next=/reset-password`).

## 4. Email confirmation settings

**Authentication → Providers → Email**

- Email provider: enabled
- **Confirm email**: ON for production (users must confirm before sign-in)
- Secure email change: ON (recommended)

## 5. Branded email templates (optional)

**Authentication → Email Templates**

Copy HTML from `docs/supabase/email-templates.md` into:

- Confirm signup
- Reset password

## 6. Rate limits

After enabling custom SMTP, Supabase may cap at ~30 emails/hour initially.
**Authentication → Rate Limits** → raise if needed for launch traffic.

## 7. Verify locally

```bash
npm run email:verify          # Resend API key + from address
npm run auth:link -- you@example.com recovery   # dev-only link without email
```

Production test:

1. Sign up with a new email → confirm link should arrive from `DriftPass <hello@driftpass.com.au>`
2. Login → Forgot password → reset link should land on `/reset-password`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No email at all | Check Supabase **Auth → Logs**; confirm SMTP saved and domain verified in Resend |
| Email in spam | Complete DKIM/SPF/DMARC in Resend; use verified domain sender |
| Link opens homepage with `?code=` | Add `callback/**` to Redirect URLs; Site URL must be `www.driftpass.com.au` |
| Reset link does not show reset form | Redirect must include `next=/reset-password`; see callback route |
| Gmail red banner — link won't click | Click **Looks safe** on the banner, or copy the plain URL from the email body. Paste branded templates from `docs/supabase/email-templates.md` to reduce false positives. |
| Test email (`+test`) not visible | Gmail delivers `you+test@gmail.com` to the same inbox — search `from:hello@driftpass.com.au` |

## Env vars (Vercel + local)

Already in `.env.example`:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@driftpass.com.au
RESEND_FROM_NAME=DriftPass
NEXT_PUBLIC_APP_URL=https://www.driftpass.com.au
```

Run `npm run vercel:env` to sync to production after updating `.env.local`.
