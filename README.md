# TapCare Analytics Dashboard

Privacy-safe operational analytics dashboard for TapCare's NFC and QR support system.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Vitest
- ESLint

## Product shape

- Admin household management dashboard
- Caregiver assigned-household view with sticker setup access
- Separate admin analytics area
- Explainable follow-up signals instead of opaque risk scores

## Authorization

`ADMIN` is a global TapCare administrator and can administer households, configure stickers, review follow-up signals, process access requests, and view analytics across all sites.

`CAREGIVER` may view and configure stickers only for households with an active assignment. Caregivers cannot perform household administration, manage follow-up signals, process access requests, or access admin analytics.

Sites are currently organizational metadata, not authorization boundaries. Site roles do not grant application permissions.

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Apply migrations with `npm run prisma:migrate`.
6. Seed demo data with `npm run db:seed`.
7. Run the app with `npm run dev`.

Database mode is the default and requires a non-empty `DATABASE_URL`. The seeded PostgreSQL setup above is the preferred development path because it exercises the production persistence layer.

For read and authentication flows that explicitly need local mock data, set:

```bash
TAPCARE_DATA_MODE=mock npm run dev
```

Mock mode is limited to local development and tests. It is rejected in production and on Vercel preview or production deployments. If `DATABASE_URL` is missing and mock mode is not explicitly enabled, TapCare reports a configuration error instead of falling back to mock users or data. Database-only setup and write operations remain unavailable in mock mode.

## Verification

Run these before pushing changes:

```bash
npm test
npm run lint
npm run build
```

## Staging

See [docs/staging-deployment.md](docs/staging-deployment.md) for hosted staging setup, environment variables, Google OAuth callback configuration, database migration, and NFC sticker testing.

## Physical NFC sticker workflow

After creating a sticker, TapCare opens its physical setup panel. Copy the displayed canonical NFC URL (or scan its QR code), write that exact URL to the NFC tag, tap the tag to verify it, then confirm the test in TapCare. A tested tag must be reset with **Replace / reprogram tag** before its sticker can be deleted or moved to another household. The authenticated **Preview sticker** screen does not record analytics.

Hosted deployments must set `PUBLIC_STICKER_BASE_URL` to the permanent HTTPS public sticker base URL. TapCare refuses to generate physical-tag URLs in production without it.

## Seeding

Use the included seed script to populate a demo site, users, households, stickers, page configs, destination configs, and interaction events.

Commands:

```bash
npm run prisma:migrate
npm run db:seed
```

What gets seeded:

- `SGO Bedok` site
- caregiver and admin users
- three households with address-based identities
- household assignments for the caregiver
- six stickers across redirect and rendered-page modes
- page and destination configs
- interaction events to make the dashboard non-empty

Seeded login credentials:

```text
Caregiver: maya.lim@example.org / TapCare1234!
Admin:     dev.admin@tapcare.sg / TapCare1234!
```

Authentication notes:

- Login uses email/password with hashed passwords.
- Browser cookies store opaque session tokens, not user IDs.
- Session tokens are stored hashed in the database.
- Public signup creates caregiver accounts only.
- Google signup also creates caregiver accounts only and does not require a TapCare password.
- Newly signed-up caregivers see no household data until they are assigned households.
- Logged-in users can change passwords from `/account/password`.
- Google-created users can set a TapCare password from `/account/password` if they want email/password sign-in too.
- Forgotten-password reset links use one-time hashed database tokens that expire after 30 minutes.
- Local development shows the reset link after requesting a reset.
- Production reset emails use Resend when `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `APP_BASE_URL` are configured.
- Google signup/sign-in is available when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_BASE_URL` are configured.
- Google OAuth callback URL: `${APP_BASE_URL}/api/auth/google/callback`.

Notes:

- the seed is rerunnable and uses fixed IDs
- setup APIs require a working `DATABASE_URL`
- database-backed reads and authentication also require `DATABASE_URL` unless explicit local mock mode is enabled

## Notes

- Prisma schema and migrations are included for the production data model.
