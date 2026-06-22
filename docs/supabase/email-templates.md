# Supabase Auth email templates (gold V2)

Paste into **Supabase → Authentication → Email Templates**.

Use the default subject lines or:

- Confirm signup: `Confirm your DriftPass account`
- Reset password: `Reset your DriftPass password`

---

## Confirm signup

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0a1628; color: #ffffff; border-radius: 16px;">
  <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #f5d78e;">Drift Pass</p>
  <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700;">Confirm your email</h1>
  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #9ca3af;">
    Thanks for joining DriftPass. Tap the button below to confirm your email and finish setting up your membership.
  </p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(135deg, #e8c872, #f5d78e, #c9a227); color: #0a1628; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
    Confirm email
  </a>
  <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
    Button not working? Copy and paste this link into your browser:
  </p>
  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; word-break: break-all;">
    {{ .ConfirmationURL }}
  </p>
  <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
    If you did not create a DriftPass account, you can ignore this email.
  </p>
</div>
```

---

## Reset password

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0a1628; color: #ffffff; border-radius: 16px;">
  <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #f5d78e;">Drift Pass</p>
  <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700;">Reset your password</h1>
  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #9ca3af;">
    We received a request to reset your DriftPass password. Click below to choose a new password.
  </p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(135deg, #e8c872, #f5d78e, #c9a227); color: #0a1628; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
    Reset password
  </a>
  <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
    Button not working? Copy and paste this link into your browser:
  </p>
  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; word-break: break-all;">
    {{ .ConfirmationURL }}
  </p>
  <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
    If you did not request this, you can safely ignore this email. Your password will not change.
  </p>
</div>
```

---

## Magic link (optional)

Same layout; button text: **Sign in to DriftPass**

```html
<a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #e8c872, #f5d78e, #c9a227); color: #0a1628; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700;">Sign in</a>
```
