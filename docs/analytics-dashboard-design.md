# TapCare Privacy-Safe Dashboard and Runtime Design

## Product stance

TapCare is not a generic analytics tool. It is an NFC runtime and an operational dashboard for community care follow-up.

Design priorities:

1. One tap should do the intended thing.
2. Admin workflow should stay simple.
3. Household-specific routing must be database-driven.
4. Privacy-safe analytics are enough; perfect attribution is not required.
5. Setup must be simple enough for caregivers, with admin able to help when needed.

## 1. Information Architecture

### Primary navigation

1. Outreach Dashboard
2. Households
3. Feature Usefulness
4. Follow-up Queue
5. Caregiver Setup
6. Caregiver View
7. Admin Analytics

### Default homepage: Outreach Dashboard

The default homepage should answer:

1. Who may need follow-up?
2. Which sticker types are useful in the field?

### Admin-facing areas

- Outreach Dashboard
  - recent follow-up signals
  - sudden inactivity
  - repeated emergency/help usage
  - repeated failed interactions
- Households
  - address-based household list
  - sticker coverage and recent usage
- Feature Usefulness
  - usage by sticker type
  - failure patterns
  - repeat usage
- Follow-up Queue
  - active signals
  - review, dismiss, resolve if needed

### Caregiver-facing areas

- Caregiver Setup
  - create sticker
  - assign to household
  - choose type
  - choose runtime mode
  - configure redirect destination or page content
  - activate or disable
- Caregiver View
  - read-only view of assigned households
  - sticker status
  - recent NFC usage
  - relevant follow-up signals

### Admin area

Separate from the household management dashboard.

- ingestion health
- routing failures
- feature adoption
- site-level settings if truly needed

## 2. Core Runtime Model

The NFC sticker stores a stable public TapCare URL, for example:

- `https://tapcare.sg/t/AB12CD`

The tag must not store:

- raw internal API endpoints
- household secrets
- a shared global contact destination

Runtime modes are intentionally simple:

- `DIRECT_REDIRECT`
- `RENDER_PAGE`

### DIRECT_REDIRECT

Used for one-tap, contact-oriented stickers.

Examples:

- emergency contact -> WhatsApp deep link
- frequent contact -> `tel:` call
- single household-specific external resource

Flow:

1. NFC tap
2. `GET /t/:publicCode`
3. backend validates code and sticker status
4. backend logs privacy-safe event
5. backend resolves household-specific destination
6. backend immediately redirects

No intermediate TapCare page should be inserted just for tracking.

### RENDER_PAGE

Used when the sticker should show content.

Examples:

- checklist / reminders
- help profile / dementia-safe identification
- curated resources page

Flow:

1. NFC tap
2. `GET /t/:publicCode`
3. backend validates code and sticker status
4. backend logs privacy-safe event
5. backend renders the appropriate household-specific page

## 3. User Workflows

### Admin workflow: morning triage

1. Admin lands on Outreach Dashboard.
2. Reviews households with recent follow-up signals.
3. Opens household detail to see plain-language evidence.
4. Optionally reviews or resolves signals.
5. Checks feature usefulness to understand what works in the field.

### Admin workflow: setup support

1. Admin searches for the household by address.
2. Creates or updates a sticker when caregiver setup did not happen.
3. Chooses sticker type and runtime mode.
4. Saves household-specific destination or page content.
5. Activates or disables the sticker.

### Caregiver workflow: simple setup

1. Caregiver opens household setup.
2. Creates sticker.
3. Selects type and runtime mode.
4. Enters destination or page content.
5. Activates sticker.

### Caregiver workflow: read-only monitoring

1. Caregiver opens assigned households.
2. Reviews recent sticker usage and any active follow-up signals.
3. Does not see unrelated households or site-wide analytics.

## 4. Domain Model

Keep the domain lightweight.

### Core entities

- `Site`
  - SGO satellite office
- `Household`
  - address-based operational unit
- `User`
  - admin, caregiver
- `HouseholdAssignment`
  - caregiver-to-household access mapping
- `Sticker`
  - physical NFC or QR sticker with a stable public code
- `DestinationConfig`
  - target for direct redirects
- `PageConfig`
  - rendered content for checklist/help/resources pages
- `InteractionEvent`
  - privacy-safe runtime events
- `FollowUpSignal`
  - explainable derived signals
- `FollowUpReview`
  - optional admin review state

### Household should be address-based

Use address fields rather than a serialized household code as the primary human-facing identity.

Recommended fields:

- `addressLine1`
- `addressLine2?`
- `unitNumber?`
- `postalCode?`
- `displayAddress`

## 5. Simplified Sticker Schema

### Sticker fields

- `id`
- `publicCode`
- `householdId`
- `siteId`
- `stickerType`
- `runtimeMode`
- `status`
- `destinationConfigId?`
- `pageConfigId?`
- `createdAt`
- `updatedAt`

### Sticker status

Keep it minimal:

- `ACTIVE`
- `DISABLED`

`DRAFT` is intentionally excluded.

### Runtime mapping

- `EMERGENCY_CONTACT` -> `DIRECT_REDIRECT`
- `FREQUENT_CONTACT` -> `DIRECT_REDIRECT`
- `CHECKLIST_REMINDER` -> `RENDER_PAGE`
- `HELP_PROFILE` -> `RENDER_PAGE`
- `CURATED_RESOURCES` -> usually `RENDER_PAGE`

If a curated resource sticker truly has one link and one action, `DIRECT_REDIRECT` is acceptable.

## 6. Revised Route Groups

### 1. Public runtime routes

- `GET /t/:publicCode`
- optional `GET /r/:redirectToken` if a tracked outbound redirect is ever needed without harming UX

Purpose:

- accept NFC / QR traffic
- resolve public code
- check sticker status
- log privacy-safe events
- redirect or render

### 2. Admin operational APIs

- `GET /api/v1/admin/dashboard/summary`
- `GET /api/v1/admin/households`
- `GET /api/v1/admin/households/:householdId`
- `GET /api/v1/admin/follow-up-signals`
- `POST /api/v1/admin/follow-up-signals/:signalId/review`

Purpose:

- admin dashboard and follow-up workflow
- not used by the sticker itself

### 3. Setup/config APIs

- `POST /api/v1/setup/stickers`
- `PATCH /api/v1/setup/stickers/:stickerId`
- `POST /api/v1/setup/stickers/:stickerId/assign-household`
- `POST /api/v1/setup/stickers/:stickerId/activate`
- `POST /api/v1/setup/stickers/:stickerId/disable`
- `GET /api/v1/setup/households/:householdId/stickers`

Purpose:

- simple caregiver or admin setup
- no heavy provisioning workflow
- household-specific configuration

### 4. Admin analytics APIs

- `GET /api/v1/admin/analytics/ingestion-health`
- `GET /api/v1/admin/analytics/failure-patterns`
- `GET /api/v1/admin/analytics/feature-adoption`
- `GET /api/v1/admin/sites/:siteId/config`
- `PATCH /api/v1/admin/sites/:siteId/config`

Purpose:

- system health
- debugging
- adoption analysis

## 7. Detailed Behavior of `GET /t/:publicCode`

1. Validate the `publicCode` format.
2. Query `Sticker` by `publicCode`.
3. If not found:
  - return simple invalid sticker page
  - log `sticker_opened` with outcome `NOT_FOUND`
4. If found but `status = DISABLED`:
  - return simple unavailable page
  - log `sticker_opened` with outcome `DISABLED`
5. Resolve household, sticker type, runtime mode, and config.
6. Log `sticker_opened`.
7. If `runtimeMode = DIRECT_REDIRECT`:
  - resolve destination from `DestinationConfig`
  - validate scheme and allowed target
  - immediately redirect
8. If `runtimeMode = RENDER_PAGE`:
  - load `PageConfig`
  - render page

### Redirect handling

- WhatsApp: redirect to a resolved `wa.me` or WhatsApp deep link
- standard external URLs: server redirect
- `tel:` links: use a minimal handoff page with immediate client-side navigation if server-side redirect behavior is unreliable in the browser

The product rule remains the same: no extra TapCare decision page for elderly contact-oriented stickers.

## 8. Privacy-Safe Event Schema

### Runtime events

- `sticker_opened`

The product only needs to know whether the sticker URL was used successfully. Avoid extra synchronous event writes in the public sticker path unless there is a clear operational need.

### Never log

- call contents
- call completion
- WhatsApp contents
- message bodies
- free-form sensitive text beyond stored page content
- unnecessary device tracking

## 9. Explainable Follow-Up Signals

Keep signals simple and explainable.

- repeated emergency contact usage
- repeated help profile usage
- unusually high contact sticker usage
- repeated reminder/checklist reliance
- sudden inactivity after prior regular use
- repeated failed interactions
- household has no active critical sticker, if that operationally matters

Avoid medical language and avoid black-box risk scoring.

## 10. RBAC

### Caregiver

- set up and update stickers for assigned households
- view assigned household usage
- read-only for operational signals unless future workflow needs more

### Admin

- cross-site visibility
- manage configuration and assignments
- admin analytics and diagnostics
- household and sticker management

## 11. Engineering Structure

Recommended modular monolith:

```text
src/
  app/
    (admin)/
    (caregiver)/
    (management)/
    t/[publicCode]/
    api/v1/
  modules/
    households/
    stickers/
    analytics/
    signals/
    auth/
    audit/
  components/
    admin/
    caregiver/
    setup/
    shared/
  prisma/
```

Boundary rules:

- public runtime logic stays separate from dashboard APIs
- service layer holds routing decisions and signal logic
- repository layer owns data access
- setup APIs stay simple and imperative

## 12. Phased Delivery

### MVP

- public `GET /t/:publicCode`
- sticker setup APIs
- admin dashboard summary
- household list/detail
- caregiver setup and read-only view
- privacy-safe interaction events
- basic follow-up signals

### Hardening

- stricter outbound target validation
- signal review history
- failure diagnostics
- real Prisma repositories replacing mock repositories

## 13. Intentional Exclusions

- no multi-stage sticker provisioning workflow
- no creator tracking for stickers
- no generic event bus or microservices
- no real-time streaming requirement
- no extra landing page for contact stickers
- no attempt to confirm message delivery or call completion
- no medical inference
