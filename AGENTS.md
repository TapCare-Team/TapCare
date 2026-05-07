# AGENTS.md

## Project priorities
- Primary user: SGO satellite office officers
- Primary goal: operational follow-up visibility and NFC usefulness insights
- Secondary goal: developer observability

## Architecture
- Use a modular monolith
- Keep domain modules explicit
- Separate officer-facing dashboard from admin/developer pages
- Prefer simple, explainable logic over abstract frameworks

## Privacy
- Never log call contents, WhatsApp contents, or message contents
- Minimize PII in analytics tables
- Treat risk as follow-up signals, not diagnosis

## Code quality
- TypeScript strict mode
- Validate all external inputs
- Service layer + repository layer
- Add tests for heuristic/signal logic
- Keep components small and composable
- Follow standard git practices and push to GitHub like a normal engineer workflow

## Avoid
- Unnecessary microservices
- Kafka/event bus unless clearly justified
- opaque risk scoring or ML
- vanity analytics on officer homepage
- making assumptions about the design without clarifying