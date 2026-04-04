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
6. Run the app with `npm run dev`.

## Notes

- The current UI is scaffolded with mock-backed services so the product flow can be reviewed before database wiring is completed.
- Prisma schema and initial migration are included for the production data model.
