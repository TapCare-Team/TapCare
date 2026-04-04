CREATE TYPE "GlobalRole" AS ENUM ('OFFICER', 'CAREGIVER', 'ADMIN', 'DEVELOPER');
CREATE TYPE "SiteRole" AS ENUM ('SITE_OFFICER', 'SITE_MANAGER', 'SITE_VIEWER', 'CAREGIVER_VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "SeniorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ArtifactType" AS ENUM ('EMERGENCY_CONTACT', 'FREQUENT_CONTACTS', 'REMINDER_CHECKLIST', 'RESOURCE_LINKS', 'HELP_PROFILE');
CREATE TYPE "ArtifactActivation" AS ENUM ('PROVISIONED', 'ACTIVATED', 'ARCHIVED');
CREATE TYPE "InteractionType" AS ENUM ('TAP', 'QR_SCAN', 'PAGE_VIEW', 'ACTION_CLICK');
CREATE TYPE "RouteType" AS ENUM ('EMERGENCY_CONTACT', 'FREQUENT_CONTACTS', 'REMINDER_CHECKLIST', 'RESOURCE_LINKS', 'HELP_PROFILE');
CREATE TYPE "EventOutcome" AS ENUM ('SUCCESS', 'FAILED', 'ABANDONED');
CREATE TYPE "FailureReason" AS ENUM ('INVALID_CODE', 'EXPIRED_ROUTE', 'PERMISSION_DENIED', 'BROKEN_LINK', 'NETWORK_ERROR', 'UNKNOWN');
CREATE TYPE "SignalType" AS ENUM ('REPEATED_EMERGENCY_USAGE', 'REPEATED_HELP_PROFILE_USAGE', 'HIGH_CONTACT_DEPENDENCE', 'HIGH_REMINDER_DEPENDENCE', 'SUDDEN_INACTIVITY', 'NEVER_ACTIVATED_KEY_STICKER', 'STOPPED_USING_KEY_STICKER', 'REPEATED_FAILED_INTERACTIONS');
CREATE TYPE "SignalStatus" AS ENUM ('ACTIVE', 'REVIEWED', 'DISMISSED', 'RESOLVED');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'REVIEWED', 'SNOOZED', 'CLOSED');

CREATE TABLE "Site" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "region" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "globalRole" "GlobalRole" NOT NULL DEFAULT 'OFFICER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserSiteRole" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "role" "SiteRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "siteId", "role")
);

CREATE TABLE "Household" (
  "id" TEXT PRIMARY KEY,
  "publicCode" TEXT NOT NULL UNIQUE,
  "siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "activatedAt" TIMESTAMP(3),
  "lastActiveAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "HouseholdAssignment" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "caregiverId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  UNIQUE("householdId", "caregiverId", "assignedAt")
);

CREATE TABLE "SeniorProfile" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "externalRef" TEXT UNIQUE,
  "displayAlias" TEXT NOT NULL,
  "status" "SeniorStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ArtifactTemplate" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "artifactType" "ArtifactType" NOT NULL,
  "isKeySticker" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareArtifact" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "seniorProfileId" TEXT REFERENCES "SeniorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "templateId" TEXT NOT NULL REFERENCES "ArtifactTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "shortCodeHash" TEXT NOT NULL UNIQUE,
  "activationState" "ArtifactActivation" NOT NULL DEFAULT 'PROVISIONED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3)
);

CREATE TABLE "InteractionEvent" (
  "id" TEXT PRIMARY KEY,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT NOT NULL,
  "householdId" TEXT REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "seniorProfileId" TEXT REFERENCES "SeniorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "artifactId" TEXT REFERENCES "CareArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "templateKey" TEXT NOT NULL,
  "interactionType" "InteractionType" NOT NULL,
  "routeType" "RouteType" NOT NULL,
  "outcome" "EventOutcome" NOT NULL,
  "failureReason" "FailureReason",
  "sessionTokenHash" TEXT,
  "metadata" JSONB
);

CREATE TABLE "FollowUpSignal" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "seniorProfileId" TEXT,
  "siteId" TEXT NOT NULL,
  "signalType" "SignalType" NOT NULL,
  "status" "SignalStatus" NOT NULL DEFAULT 'ACTIVE',
  "firstObservedAt" TIMESTAMP(3) NOT NULL,
  "lastObservedAt" TIMESTAMP(3) NOT NULL,
  "explanation" TEXT NOT NULL,
  "evidence" JSONB NOT NULL
);

CREATE TABLE "FollowUpReview" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "signalId" TEXT,
  "reviewerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "snoozedUntil" TIMESTAMP(3)
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB
);

CREATE INDEX "HouseholdAssignment_caregiverId_endedAt_idx" ON "HouseholdAssignment"("caregiverId", "endedAt");
CREATE INDEX "HouseholdAssignment_householdId_endedAt_idx" ON "HouseholdAssignment"("householdId", "endedAt");
CREATE INDEX "InteractionEvent_siteId_occurredAt_idx" ON "InteractionEvent"("siteId", "occurredAt");
CREATE INDEX "InteractionEvent_householdId_occurredAt_idx" ON "InteractionEvent"("householdId", "occurredAt");
CREATE INDEX "InteractionEvent_templateKey_occurredAt_idx" ON "InteractionEvent"("templateKey", "occurredAt");
CREATE INDEX "InteractionEvent_outcome_occurredAt_idx" ON "InteractionEvent"("outcome", "occurredAt");
CREATE INDEX "FollowUpSignal_siteId_status_lastObservedAt_idx" ON "FollowUpSignal"("siteId", "status", "lastObservedAt");
CREATE INDEX "FollowUpSignal_householdId_status_idx" ON "FollowUpSignal"("householdId", "status");
CREATE INDEX "FollowUpReview_reviewerId_status_idx" ON "FollowUpReview"("reviewerId", "status");
CREATE INDEX "FollowUpReview_householdId_status_idx" ON "FollowUpReview"("householdId", "status");
