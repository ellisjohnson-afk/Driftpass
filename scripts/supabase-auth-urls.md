# Supabase auth URL checklist (manual — 2 min)

**Critical:** If Site URL is `https://driftpass.vercel.app`, Google OAuth fails with `bad_oauth_state` because PKCE cookies are set on `www.driftpass.com.au` but errors redirect to the Vercel domain.

**Auth emails:** connect Resend SMTP — see `scripts/supabase-auth-email-setup.md`.

After running `node scripts/sync-vercel-env.mjs`, set these in Supabase Dashboard:

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://www.driftpass.com.au` |
| Redirect URLs | see list below |

Add **all** redirect URLs:

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

OAuth and signup confirmation use bare `/callback` plus an `auth_post_login` cookie (or `intended_next` in user metadata).

**Remove or do not use as Site URL:**

```
https://driftpass.vercel.app
https://driftpass.vercel.app/callback
```

**Vercel Production env (must match):**

```
NEXT_PUBLIC_APP_URL=https://www.driftpass.com.au
```

**Expected browser console on Google sign-in:**

```
[OAuth] canonicalOrigin: https://www.driftpass.com.au
[OAuth] postAuthNext (cookie): /pricing?plan=explorer
[OAuth] redirectTo: https://www.driftpass.com.au/callback
```

**Authentication → Providers → Google**

- Enabled
- Client ID + Secret from Google Cloud (DriftPass Supabase OAuth client)

**Google Cloud → Authorized redirect URI (unchanged):**

```
https://kxutuhifihgogrervsve.supabase.co/auth/v1/callback
```

**Google Cloud → Audience → Test users**

- Add the Gmail addresses you will sign in with (while app is in Testing mode)
