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

- Officer-first outreach dashboard
- Caregiver assigned-household view with sticker setup access
- Separate admin analytics area
- Explainable follow-up signals instead of opaque risk scores

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Apply migrations with `npm run prisma:migrate`.
6. Seed demo data with `npm run db:seed`.
7. Run the app with `npm run dev`.

## Verification

Run these before pushing changes:

```bash
npm test
npm run lint
npm run build
```

## Staging

See [docs/staging-deployment.md](docs/staging-deployment.md) for hosted staging setup, environment variables, Google OAuth callback configuration, database migration, and NFC sticker testing.

## Seeding

Use the included seed script to populate a demo site, users, households, stickers, page configs, destination configs, and interaction events.

Commands:

```bash
npm run prisma:migrate
npm run db:seed
```

What gets seeded:

- `SGO Bedok` site
- officer, caregiver, and admin users
- three households with address-based identities
- household assignments for the caregiver
- six stickers across redirect and rendered-page modes
- page and destination configs
- interaction events to make the dashboard non-empty

Seeded login credentials:

```text
Officer:   amina.tan@tapcare.sg / TapCare1234!
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
- read flows still fall back to mock data if the database is not configured, but future developers should prefer running the seed so the Prisma-backed paths are exercised

## Notes

- Read paths can fall back to mock data when `DATABASE_URL` is not configured, but setup APIs require Postgres.
- Prisma schema and initial migration are included for the production data model.
