# Plan D launch checklist

Run through these in order. Code is deployed; remaining items are mostly Supabase dashboard + smoke tests.

## 1. Auth emails (5 min)

- [ ] Resend domain `driftpass.com.au` verified — `npm run email:verify`
- [ ] Supabase **Authentication → Email** — Custom SMTP on (`smtp.resend.com`, port 465)
- [ ] Paste branded templates from `docs/supabase/email-templates.md` into **Reset password** and **Confirm signup**
- [ ] **Authentication → Providers → Email** — turn **Confirm email** **ON** for production
- [ ] **Authentication → URL Configuration** — Site URL `https://www.driftpass.com.au`, redirect URLs per `scripts/supabase-auth-urls.md`

Verify:

```bash
npm run email:verify
node scripts/check-auth-email.mjs you@example.com
```

Manual: sign up with a new email → confirm link → lands on pricing/checkout.

## 2. Google OAuth (5 min)

- [ ] Supabase **Authentication → Providers → Google** — enabled with Client ID + Secret
- [ ] Google Cloud OAuth client redirect URI: `https://kxutuhifihgogrervsve.supabase.co/auth/v1/callback`
- [ ] If app is in **Testing** mode, add your Gmail as a test user
- [ ] Site URL must be `www.driftpass.com.au` (not `driftpass.vercel.app`)

Manual: **Continue with Google** on `/signup` → returns to app with session.

## 3. Production smoke test

```bash
npm run test:e2e -- https://www.driftpass.com.au
```

Manual partner flow:

1. Member opens **My Pass** — note 6-digit PIN
2. Partner opens **https://www.driftpass.com.au/scan** (bookmark on tablet)
3. Select business + service → enter PIN → **Approved**

## 4. Database migrations (if not applied)

| Migration | Command | What |
|-----------|---------|------|
| 008 | `npm run db:apply-008` | Partner opening hours |
| 011 | Run `supabase/migrations/011_profile_metadata_sync.sql` in SQL editor | Traveller type + Google avatar on signup |
| 007 | `npm run db:apply-007` | Avatar uploads (optional) |

## 5. Done when

- [ ] Signup confirm email arrives (branded) and link works
- [ ] Forgot password email arrives and `/reset-password` works
- [ ] Google sign-in works on production domain
- [ ] PIN redemption works on `/scan` with a live partner
- [ ] Bottom nav: Explore, Trip Help, My Pass, Profile all load
