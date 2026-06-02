# Supabase auth URL checklist (manual — 2 min)

**Critical:** If Site URL is `https://driftpass.vercel.app`, Google OAuth fails with `bad_oauth_state` because PKCE cookies are set on `www.driftpass.com.au` but errors redirect to the Vercel domain.

After running `node scripts/sync-vercel-env.mjs`, set these in Supabase Dashboard:

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://www.driftpass.com.au` |
| Redirect URLs | `https://www.driftpass.com.au/callback` |

Also add (optional, if apex domain redirects):

```
https://driftpass.com.au/callback
```

**Remove or do not use as Site URL:**

```
https://driftpass.vercel.app
https://driftpass.vercel.app/callback
```

**Vercel Production env (must match):**

```
NEXT_PUBLIC_APP_URL=https://www.driftpass.com.au
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
