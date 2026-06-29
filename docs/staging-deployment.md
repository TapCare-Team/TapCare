# Staging Deployment

Use staging to test real NFC sticker scans, HTTPS cookies, Google OAuth redirects, password reset links, and hosted database behavior before any real rollout.

## Recommended Shape

- Next.js hosting: Vercel or another Node-capable Next.js host.
- Database: hosted PostgreSQL, separate from local Docker and separate from any future production database.
- Domain: use the platform preview domain first, then move to a staging subdomain if needed.

Example staging URL:

```text
https://tapcare-staging.vercel.app
```

## Required Environment Variables

Set these in the staging host:

```text
DATABASE_URL=
APP_BASE_URL=https://your-staging-domain
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
AUTH_EMAIL_FROM=TapCare <noreply@your-domain>
```

`APP_BASE_URL` must exactly match the public staging origin. Do not use `localhost` or `0.0.0.0` in staging.

## Google OAuth

Add this authorized redirect URI in Google Cloud Console:

```text
https://your-staging-domain/api/auth/google/callback
```

Keep the local redirect URI too:

```text
http://localhost:3000/api/auth/google/callback
```

## Database Setup

After connecting the hosted PostgreSQL database, run:

```bash
npm run prisma:deploy
```

For staging-only demo data, run:

```bash
npm run db:seed
```

Do not seed real NRIC, exact medical diagnoses, full private notes, or unnecessary sensitive details.

## Deployment Checks

Before scanning real NFC stickers:

- Sign up with email/password.
- Sign up with Google.
- Confirm new caregivers see no households until assigned.
- Sign in as officer and admin seeded accounts only if using seeded staging data.
- Assign a caregiver to a household.
- Confirm the caregiver sees only assigned households.
- Create each sticker type.
- Visit a public sticker URL at `/t/[publicCode]`.
- Confirm public pages do not expose full NRIC, exact diagnosis, full address, or private notes.
- Disable a sticker and confirm its public URL no longer exposes useful content.
- Confirm interaction events are recorded.

## NFC Sticker Test

Write the staging public sticker URL to one NFC sticker first:

```text
https://your-staging-domain/t/[publicCode]
```

Scan it from a phone using mobile data, not the same local network. This confirms the URL is genuinely public.

## Promotion Rule

Only promote staging to production after:

```bash
npm run lint
npm test
npm run build
npm run prisma:deploy
```

Also retest Google OAuth because production has a different callback URL.
