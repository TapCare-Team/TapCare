# TapCare Privacy-Safe Analytics Dashboard Design

## 1. Product-Oriented Dashboard Information Architecture

### Primary navigation

1. Outreach Dashboard
2. Seniors / Households
3. Feature Usefulness
4. Follow-up Queue
5. Caregiver View
6. Admin Analytics
7. Settings

### Default homepage: Outreach Dashboard

The default homepage should answer two questions immediately:

1. Who may need follow-up?
2. Which NFC features appear useful in the field?

### Outreach Dashboard sections

- Follow-up candidates
  - Seniors or households with explainable signals that suggest outreach may be useful
  - Sorted by recency and signal severity, not by a black-box score
- Activity changes
  - Sudden inactivity after prior regular usage
  - Newly activated households
  - Households with key sticker activation gaps
- Feature usefulness snapshot
  - Emergency contact usage
  - Frequent contacts usage
  - Reminder/checklist usage
  - Resource links usage
  - Help profile usage
- Operational issues
  - Failed scans
  - Repeated dead-end interactions
  - Stickers with low activation or high failure rates

### Seniors / Households

- Household list with filters by satellite office, status, activation state, and signal type
- Household detail page
  - Assigned office
  - NFC assets issued
  - Activation status
  - 30-day activity summary
  - Follow-up signals with simple explanations
  - Contact-safe operational notes

### Feature Usefulness

- Compare which sticker/page types are being used
- Show activation rate, repeat use rate, and failure rate by feature type
- Segment by office or cohort
- Avoid vanity charts like page views over time unless they support decisions

### Follow-up Queue

- Queue for officers to review possible outreach candidates
- Filters for signal type, recency, assigned office, and acknowledgment status
- Officer actions
  - mark reviewed
  - add follow-up note
  - assign colleague
  - snooze for later review

### Caregiver View

- Restricted read-only view for caregivers assigned to specific households
- Household-level recent NFC activity and activation status for assigned households only
- Read-only visibility into follow-up signals to support day-to-day care coordination
- No site-wide comparisons, cross-household rankings outside assigned caseload, or admin diagnostics

### Admin Analytics

Separate from operational dashboard.

- System health
- Tag issuance and activation pipeline
- Event ingestion quality
- Failed route resolution
- RBAC and audit activity
- No officer-focused triage here

## 2. User Workflows for SGO Satellite Office Officers

### Workflow A: Morning triage

1. Officer lands on Outreach Dashboard.
2. Reviews follow-up candidates generated in the last 7 days.
3. Opens household detail to see signal explanations.
4. Marks candidates as reviewed or creates a follow-up task.
5. Checks feature usefulness snapshot to see whether a rollout is working.

### Workflow B: Investigate a household

1. Officer searches by household code or senior alias.
2. Opens household page.
3. Reviews activation state, key sticker coverage, and recent usage changes.
4. Reads simple signal explanations such as "help profile opened 4 times in 3 days".
5. Logs a non-sensitive follow-up note.

### Workflow C: Monitor local rollout effectiveness

1. Officer opens Feature Usefulness.
2. Filters to their satellite office and recent 30 or 90 days.
3. Compares sticker types by activation, repeat use, and failure rate.
4. Uses this to decide what to emphasize in training or future distributions.

### Workflow D: Review usability issues

1. Officer checks operational issues section.
2. Sees repeated failed scans or high dead-end interaction rates.
3. Identifies confusing stickers, broken QR routes, or households needing setup help.

## 2A. User Workflows for Caregivers

### Workflow E: Check assigned households

1. Caregiver opens Caregiver View.
2. Sees only households they are explicitly assigned to.
3. Reviews recent NFC usage, activation gaps, and existing follow-up signals.
4. Uses this to understand whether a household may need a check-in.

### Workflow F: Review one household safely

1. Caregiver opens an assigned household detail page.
2. Reviews recent usage by sticker type and the plain-language signal explanations.
3. Does not see unrelated households, site-wide rollups, or admin analytics.

## 3. Domain Model and Database Schema

### Core entities

- Site
  - SGO satellite office or other organizational unit
- User
  - Officer, caregiver, admin, or developer
- Household
  - Operational unit for outreach and assignment
- HouseholdAssignment
  - Maps a caregiver to a household they are responsible for
- SeniorProfile
  - Minimal senior-specific record linked to household
- CareArtifact
  - A physical NFC/QR sticker or digital artifact assigned to a household or senior
- ArtifactTemplate
  - Type of sticker/page, such as emergency contact or reminders
- InteractionEvent
  - Privacy-safe event produced when a sticker/page is used
- FollowUpSignal
  - Explainable derived signal for operational review
- FollowUpReview
  - Officer review state and non-sensitive note
- AuditLog
  - Security and RBAC-sensitive actions

### Prisma-oriented schema sketch

```prisma
model Site {
  id            String      @id @default(cuid())
  code          String      @unique
  name          String
  region        String?
  households    Household[]
  users         UserSiteRole[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model User {
  id            String           @id @default(cuid())
  email         String           @unique
  displayName   String
  status        UserStatus       @default(ACTIVE)
  globalRole    GlobalRole       @default(OFFICER)
  siteRoles     UserSiteRole[]
  householdAssignments HouseholdAssignment[]
  reviews       FollowUpReview[]
  auditLogs     AuditLog[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

model UserSiteRole {
  id            String    @id @default(cuid())
  userId        String
  siteId        String
  role          SiteRole
  user          User      @relation(fields: [userId], references: [id])
  site          Site      @relation(fields: [siteId], references: [id])

  @@unique([userId, siteId, role])
}

model HouseholdAssignment {
  id            String      @id @default(cuid())
  householdId   String
  caregiverId   String
  assignedAt    DateTime    @default(now())
  endedAt       DateTime?
  household     Household   @relation(fields: [householdId], references: [id])
  caregiver     User        @relation(fields: [caregiverId], references: [id])

  @@index([caregiverId, endedAt])
  @@index([householdId, endedAt])
  @@unique([householdId, caregiverId, assignedAt])
}

model Household {
  id                  String             @id @default(cuid())
  publicCode          String             @unique
  siteId              String
  status              HouseholdStatus    @default(ACTIVE)
  activatedAt         DateTime?
  lastActiveAt        DateTime?
  site                Site               @relation(fields: [siteId], references: [id])
  assignments         HouseholdAssignment[]
  seniors             SeniorProfile[]
  artifacts           CareArtifact[]
  signals             FollowUpSignal[]
  reviews             FollowUpReview[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}

model SeniorProfile {
  id                  String         @id @default(cuid())
  householdId         String
  externalRef         String?        @unique
  displayAlias        String
  status              SeniorStatus   @default(ACTIVE)
  household           Household      @relation(fields: [householdId], references: [id])
  artifacts           CareArtifact[]
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}

model ArtifactTemplate {
  id                  String            @id @default(cuid())
  key                 String            @unique
  name                String
  artifactType        ArtifactType
  isKeySticker        Boolean           @default(false)
  artifacts           CareArtifact[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}

model CareArtifact {
  id                  String              @id @default(cuid())
  householdId         String
  seniorProfileId     String?
  templateId          String
  shortCodeHash       String              @unique
  activationState     ArtifactActivation  @default(PROVISIONED)
  issuedAt            DateTime            @default(now())
  activatedAt         DateTime?
  archivedAt          DateTime?
  household           Household           @relation(fields: [householdId], references: [id])
  seniorProfile       SeniorProfile?      @relation(fields: [seniorProfileId], references: [id])
  template            ArtifactTemplate    @relation(fields: [templateId], references: [id])
  events              InteractionEvent[]
}

model InteractionEvent {
  id                  String         @id @default(cuid())
  occurredAt          DateTime
  siteId              String
  householdId         String?
  seniorProfileId     String?
  artifactId          String?
  templateKey         String
  interactionType     InteractionType
  routeType           RouteType
  outcome             EventOutcome
  failureReason       FailureReason?
  sessionTokenHash    String?
  metadata            Json?
  household           Household?     @relation(fields: [householdId], references: [id])
  seniorProfile       SeniorProfile? @relation(fields: [seniorProfileId], references: [id])
  artifact            CareArtifact?  @relation(fields: [artifactId], references: [id])

  @@index([siteId, occurredAt])
  @@index([householdId, occurredAt])
  @@index([templateKey, occurredAt])
  @@index([outcome, occurredAt])
}

model FollowUpSignal {
  id                  String           @id @default(cuid())
  householdId         String
  seniorProfileId     String?
  siteId              String
  signalType          SignalType
  status              SignalStatus     @default(ACTIVE)
  firstObservedAt     DateTime
  lastObservedAt      DateTime
  explanation         String
  evidence            Json
  household           Household        @relation(fields: [householdId], references: [id])

  @@index([siteId, status, lastObservedAt])
  @@index([householdId, status])
}

model FollowUpReview {
  id                  String           @id @default(cuid())
  householdId         String
  signalId            String?
  reviewerId          String
  status              ReviewStatus     @default(PENDING)
  note                String?
  reviewedAt          DateTime?
  snoozedUntil        DateTime?
  household           Household        @relation(fields: [householdId], references: [id])
  reviewer            User             @relation(fields: [reviewerId], references: [id])

  @@index([reviewerId, status])
  @@index([householdId, status])
}

model AuditLog {
  id                  String         @id @default(cuid())
  actorUserId         String
  action              String
  entityType          String
  entityId            String
  occurredAt          DateTime       @default(now())
  metadata            Json?
  actor               User           @relation(fields: [actorUserId], references: [id])
}

enum GlobalRole {
  OFFICER
  CAREGIVER
  ADMIN
  DEVELOPER
}

enum SiteRole {
  SITE_OFFICER
  SITE_MANAGER
  SITE_VIEWER
  CAREGIVER_VIEWER
}

enum UserStatus {
  ACTIVE
  DISABLED
}

enum HouseholdStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum SeniorStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum ArtifactType {
  EMERGENCY_CONTACT
  FREQUENT_CONTACTS
  REMINDER_CHECKLIST
  RESOURCE_LINKS
  HELP_PROFILE
}

enum ArtifactActivation {
  PROVISIONED
  ACTIVATED
  ARCHIVED
}

enum InteractionType {
  TAP
  QR_SCAN
  PAGE_VIEW
  ACTION_CLICK
}

enum RouteType {
  EMERGENCY_CONTACT
  FREQUENT_CONTACTS
  REMINDER_CHECKLIST
  RESOURCE_LINKS
  HELP_PROFILE
}

enum EventOutcome {
  SUCCESS
  FAILED
  ABANDONED
}

enum FailureReason {
  INVALID_CODE
  EXPIRED_ROUTE
  PERMISSION_DENIED
  BROKEN_LINK
  NETWORK_ERROR
  UNKNOWN
}

enum SignalType {
  REPEATED_EMERGENCY_USAGE
  REPEATED_HELP_PROFILE_USAGE
  HIGH_CONTACT_DEPENDENCE
  HIGH_REMINDER_DEPENDENCE
  SUDDEN_INACTIVITY
  NEVER_ACTIVATED_KEY_STICKER
  STOPPED_USING_KEY_STICKER
  REPEATED_FAILED_INTERACTIONS
}

enum SignalStatus {
  ACTIVE
  REVIEWED
  DISMISSED
  RESOLVED
}

enum ReviewStatus {
  PENDING
  REVIEWED
  SNOOZED
  CLOSED
}
```

## 4. Privacy-Safe Analytics Event Schema

### Principles

- Log only what is necessary for operational insight
- Avoid message bodies, contact content, free-text user input, or call details
- Prefer IDs and template keys over personal data
- Hash or tokenize public route codes and client session identifiers
- Keep event metadata tightly controlled and schema-validated

### Event payload

```ts
type AnalyticsEvent = {
  eventId: string;
  occurredAt: string;
  siteId: string;
  householdId?: string;
  seniorProfileId?: string;
  artifactId?: string;
  templateKey:
    | "emergency_contact"
    | "frequent_contacts"
    | "reminder_checklist"
    | "resource_links"
    | "help_profile";
  interactionType: "tap" | "qr_scan" | "page_view" | "action_click";
  routeType:
    | "emergency_contact"
    | "frequent_contacts"
    | "reminder_checklist"
    | "resource_links"
    | "help_profile";
  outcome: "success" | "failed" | "abandoned";
  failureReason?:
    | "invalid_code"
    | "expired_route"
    | "permission_denied"
    | "broken_link"
    | "network_error"
    | "unknown";
  sessionTokenHash?: string;
  metadata?: {
    actionKey?: "call" | "whatsapp" | "open_link" | "check_item";
    checklistItemCount?: number;
  };
};
```

### Explicitly excluded from analytics storage

- call recipient phone numbers in event payloads
- call duration
- call audio or transcripts
- WhatsApp message content
- contact names unless already required in operational records
- reminder item text in analytics payload
- any free-form content entered by seniors or caregivers
- precise geolocation

## 5. Follow-Up Signal Logic with Explainable Heuristics

Signals should be transparent, threshold-based, and reviewable by officers.

### Signal: repeated emergency usage

- Trigger when emergency contact route has 3 or more successful opens within 7 days
- Explanation example:
  - "Emergency contact sticker opened 3 times in 7 days."
- Why it matters:
  - may indicate repeated need for urgent support contact

### Signal: repeated help profile usage

- Trigger when help profile route has 4 or more opens within 7 days
- Explanation example:
  - "Help profile page opened 4 times in 7 days."
- Why it matters:
  - may indicate frequent reliance on identification/help information

### Signal: high contact dependence

- Trigger when frequent contacts route is used at least 10 times in 7 days
- Require usage on at least 3 separate days to avoid one-off spikes
- Explanation example:
  - "Contact sticker used 12 times across 4 days in the last week."

### Signal: high reminder dependence

- Trigger when reminder/checklist route is used at least 14 times in 7 days
- Or at least twice daily on 5 of the last 7 days
- Explanation example:
  - "Reminder sticker used repeatedly on 5 days this week."

### Signal: sudden inactivity

- Trigger when household had activity on at least 8 days in the previous 30-day baseline window
- And has no activity for the last 10 days
- Explanation example:
  - "Household was active on 10 days last month and has had no activity for 10 days."

### Signal: never activated key sticker

- Trigger when a key sticker was issued more than 14 days ago and remains unactivated
- Key stickers usually include emergency contact or help profile
- Explanation example:
  - "Emergency contact sticker issued 18 days ago has not been activated."

### Signal: stopped using key sticker

- Trigger when a key sticker had prior successful usage but none in the last 30 days
- Explanation example:
  - "Help profile sticker was previously used and has not been used in the last 30 days."

### Signal: repeated failed interactions

- Trigger when 3 or more failed events occur for the same household within 7 days
- Or failure rate exceeds 40 percent with at least 5 attempts
- Explanation example:
  - "4 failed interactions recorded in 7 days, mostly broken link outcomes."

### Design rules

- No opaque composite score in MVP
- Each signal stands on its own and carries explicit evidence
- Officers can review, dismiss, or resolve a signal
- Admins can tune thresholds through configuration later, not by editing code directly

### Ethical and privacy concerns

- These are operational signals, not diagnoses
- UI language must say "possible outreach candidate" or "follow-up signal"
- Avoid labels like "high risk senior"
- Explanations should state what happened, not what it means medically

## 6. API Design

### Design principles

- Separate operational and admin APIs
- Use validated request and response contracts
- Keep derived signal generation in service layer
- Prefer server-side aggregation over sending raw events to the client

### Suggested route groups

#### Officer operational API

- `GET /api/v1/officer/dashboard/summary`
  - follow-up counts
  - recent activity changes
  - feature usefulness snapshot
- `GET /api/v1/officer/households`
  - paginated, filterable household list
- `GET /api/v1/officer/households/:householdId`
  - operational household detail
- `GET /api/v1/officer/follow-up-signals`
  - filter by site, status, type, and recency
- `POST /api/v1/officer/follow-up-signals/:signalId/review`
  - mark reviewed, dismiss, snooze, or resolve

#### Caregiver API

- `GET /api/v1/caregiver/households`
  - returns assigned households only
- `GET /api/v1/caregiver/households/:householdId`
  - recent NFC usage and active follow-up signals for an assigned household
- `GET /api/v1/caregiver/dashboard/summary`
  - simple caseload summary for assigned households only

#### Admin analytics API

- `GET /api/v1/admin/analytics/feature-adoption`
- `GET /api/v1/admin/analytics/ingestion-health`
- `GET /api/v1/admin/analytics/failure-patterns`
- `GET /api/v1/admin/sites/:siteId/config`
- `PATCH /api/v1/admin/sites/:siteId/config`

#### Event ingestion API

- `POST /api/v1/events/interactions`
  - authenticated server-side route or signed client route
  - request body validated with Zod
  - writes normalized events only

### Response shape example

```ts
type FollowUpSignalDto = {
  id: string;
  householdId: string;
  seniorProfileId?: string;
  signalType:
    | "REPEATED_EMERGENCY_USAGE"
    | "REPEATED_HELP_PROFILE_USAGE"
    | "HIGH_CONTACT_DEPENDENCE"
    | "HIGH_REMINDER_DEPENDENCE"
    | "SUDDEN_INACTIVITY"
    | "NEVER_ACTIVATED_KEY_STICKER"
    | "STOPPED_USING_KEY_STICKER"
    | "REPEATED_FAILED_INTERACTIONS";
  status: "ACTIVE" | "REVIEWED" | "DISMISSED" | "RESOLVED";
  explanation: string;
  firstObservedAt: string;
  lastObservedAt: string;
  evidence: {
    eventCount?: number;
    activeDays?: number;
    baselineDays?: number;
    inactiveDays?: number;
    failureRate?: number;
  };
};
```

## 7. Folder Structure

Suggested modular monolith structure:

```text
src/
  app/
    (officer)/
      dashboard/
      households/
      follow-up/
    (caregiver)/
      caregiver/
        dashboard/
        households/
    (admin)/
      admin/
        analytics/
        sites/
    api/
      v1/
        officer/
        caregiver/
        admin/
        events/
  modules/
    analytics/
      domain/
      repositories/
      services/
      contracts/
      mappers/
      tests/
    households/
      domain/
      repositories/
      services/
      contracts/
      tests/
    signals/
      domain/
      repositories/
      services/
      contracts/
      tests/
    auth/
      domain/
      services/
    audit/
      repositories/
      services/
  components/
    officer/
    admin/
    shared/
  lib/
    db/
    auth/
    logging/
    validation/
    time/
  prisma/
    schema.prisma
    migrations/
  docs/
```

### Boundary rules

- `app/` holds route composition only
- `modules/*/services` contain business logic
- `repositories` are the only layer talking directly to Prisma
- `contracts` contain Zod schemas and DTOs
- `components/officer` and `components/admin` stay separate to avoid mixing priorities

## 8. RBAC Model

### Roles

- Site Officer
  - View only households and signals in assigned site
  - Review and annotate follow-up signals for assigned site
- Caregiver
  - View NFC usage and follow-up signals only for explicitly assigned households
  - Read-only access with no cross-site or cross-household browsing outside assignment scope
- Site Manager
  - Same as officer plus site-level configuration visibility and staff coordination views
- Admin
  - Cross-site operational visibility
  - Manage artifact templates, threshold configs, and user/site assignments
- Developer
  - Access admin analytics, ingestion health, and diagnostics
  - No broad access to officer notes unless explicitly granted

### Access rules

- Officers only see households and signals for their permitted sites
- Caregivers only see households that have an active `HouseholdAssignment` to them
- Caregivers have read-only access and cannot review, dismiss, or resolve signals
- Cross-site aggregation is admin-only
- Sensitive household detail is minimized even within permitted sites
- All review actions and config changes create audit logs
- Admin analytics routes are not visible in officer navigation

## 9. Phased Implementation Plan

### Phase 1: MVP

- Authentication and RBAC
- Core entities and Prisma migrations
- Household assignment model for caregivers
- Interaction event ingestion endpoint
- Outreach Dashboard homepage
- Caregiver dashboard and assigned-household detail page
- Household list and detail page
- Basic follow-up signal generation
- Follow-up review workflow
- Feature usefulness snapshot
- Unit tests for signal heuristics

### Phase 2: Operational hardening

- Background job for recomputing signals and inactivity windows
- Audit logs and review history
- Better filtering and queue management
- Site-level configuration for thresholds
- Structured logging and error dashboards
- Integration tests for APIs

### Phase 3: Stronger version

- Trend comparisons by cohort or office
- Activation funnel for issued stickers
- Improved artifact diagnostics
- Exportable outreach reports with privacy-safe fields
- Fine-grained permission policies
- Data retention tooling and archival policies

## 10. Intentional Exclusions to Avoid Overengineering

- No machine learning risk scoring
- No Kafka, event bus, or microservice split
- No real-time streaming dashboard unless proven necessary
- No storing raw device telemetry beyond minimal diagnostics
- No generic BI warehouse in MVP
- No household geolocation heatmaps
- No custom rule-builder UI in MVP
- No free-form analytics dimensions that expand privacy scope
- No complicated workflow engine for officer tasks
- No attempt to infer medical condition from usage patterns

## Recommended UX framing and copy

- Use "Follow-up signals"
- Use "Possible outreach candidates"
- Use "Recent activity changes"
- Avoid "risk score", "critical patient", or "decline detection"

## Recommended engineering posture

- Modular monolith with strong service boundaries
- Zod validation at API edges
- Prisma repositories with narrow query methods
- Derived signal logic isolated and unit-tested
- Server components for data-heavy pages where appropriate
- Minimal client state, mostly for filters and review actions
- Structured logs with request ID, site ID, actor ID, and route group
