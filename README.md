# TapCare Analytics Dashboard

Privacy-safe operational analytics dashboard for TapCare's NFC and QR support system.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Vitest

## Product shape

- Officer-first outreach dashboard
- Caregiver read-only caseload view
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

Notes:

- the seed is rerunnable and uses fixed IDs
- setup APIs require a working `DATABASE_URL`
- read flows still fall back to mock data if the database is not configured, but future developers should prefer running the seed so the Prisma-backed paths are exercised

## Notes

- The current UI is scaffolded with mock-backed services so the product flow can be reviewed before database wiring is completed.
- Prisma schema and initial migration are included for the production data model.
