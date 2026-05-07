# TapCare GitHub SOP

## 1. Always Work on a Feature Branch

Do not commit directly to `main`.

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Example:

```bash
git checkout -b feature/household-search
```

## 2. Sync Before Starting Work

Before starting a new task, sync with GitHub:

```bash
git checkout main
git pull origin main
```

Then create a new branch from the updated `main`.

## 3. Commit Small, Meaningful Chunks

Use clear commit messages:

```bash
git add .
git commit -m "feat: add household search"
```

Common prefixes:

```text
feat: new feature
fix: bug fix
docs: documentation
refactor: code restructure without behavior change
test: add or update tests
chore: maintenance
```

## 4. Push the Branch to GitHub

```bash
git push -u origin feature/short-description
```

## 5. Open a Pull Request

On GitHub, open a PR from:

```text
feature/short-description -> main
```

Fill in the PR template properly, especially:

- Summary
- User impact
- Operational follow-up impact
- NFC / sticker impact
- Privacy checks
- Testing commands
- Deployment notes

## 6. Privacy Rules Are Non-Negotiable

Never log:

- call contents
- WhatsApp contents
- message contents

Minimize PII in:

- analytics tables
- event logs
- debug logs
- screenshots

Risk signals must be treated as follow-up prompts, not diagnoses.

## 7. Code Architecture Rules

Follow the modular monolith structure.

Keep domain modules explicit:

```text
src/modules/<domain>/domain
src/modules/<domain>/services
src/modules/<domain>/repositories
src/modules/<domain>/contracts
```

Use:

- service layer for business logic
- repository layer for data access
- contracts for validating external inputs
- small reusable components for UI

## 8. Run Checks Before Pushing

At minimum:

```bash
npm test
npm run lint
npm run build
```

If one fails, either fix it or write clearly in the PR what failed and why.

## 9. Add Tests for Risky Logic

Tests are especially important for:

- follow-up signal logic
- heuristics
- sticker / NFC setup flows
- household creation and duplicate checks
- external input validation

## 10. Merge Only Through Pull Requests

Once reviewed, merge the PR into `main` on GitHub.

After merging, everyone should update local `main`:

```bash
git checkout main
git pull origin main
```

## 11. Start Fresh After a PR Is Merged

Do not keep stacking unrelated work on an old merged branch.

Start a new branch from latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/new-task
```

## 12. Keep the Product Priorities Clear

TapCare priorities:

1. Officer follow-up visibility
2. NFC usefulness insights
3. Developer observability

Avoid:

- unnecessary microservices
- Kafka / event bus unless clearly justified
- opaque ML or risk scoring
- vanity analytics on officer homepage
- large abstract frameworks without need

## One-Line Workflow

```bash
git checkout main
git pull origin main
git checkout -b feature/my-task
# make changes
npm test
npm run lint
npm run build
git add .
git commit -m "feat: describe change"
git push -u origin feature/my-task
# open PR on GitHub into main
```
