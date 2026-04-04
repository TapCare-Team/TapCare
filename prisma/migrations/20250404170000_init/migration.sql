CREATE TYPE "GlobalRole" AS ENUM ('OFFICER', 'CAREGIVER', 'ADMIN', 'DEVELOPER');
CREATE TYPE "SiteRole" AS ENUM ('SITE_OFFICER', 'SITE_MANAGER', 'SITE_VIEWER', 'CAREGIVER_VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "SeniorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "StickerType" AS ENUM ('EMERGENCY_CONTACT', 'FREQUENT_CONTACT', 'CHECKLIST_REMINDER', 'HELP_PROFILE', 'CURATED_RESOURCES');
CREATE TYPE "RuntimeMode" AS ENUM ('DIRECT_REDIRECT', 'RENDER_PAGE');
CREATE TYPE "StickerStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "DestinationType" AS ENUM ('WHATSAPP', 'PHONE', 'EXTERNAL_URL');
CREATE TYPE "PageType" AS ENUM ('CHECKLIST', 'HELP_PROFILE', 'RESOURCES');
CREATE TYPE "InteractionEventType" AS ENUM ('STICKER_OPENED', 'REDIRECT_ISSUED', 'PAGE_RENDERED', 'PAGE_ACTION_CLICKED');
CREATE TYPE "EventOutcome" AS ENUM ('SUCCESS', 'FAILED');
CREATE TYPE "FailureReason" AS ENUM ('INVALID_CODE', 'DISABLED_STICKER', 'INVALID_DESTINATION', 'MISSING_CONFIGURATION', 'BROKEN_LINK', 'UNKNOWN');
CREATE TYPE "SignalType" AS ENUM ('REPEATED_EMERGENCY_USAGE', 'REPEATED_HELP_PROFILE_USAGE', 'HIGH_CONTACT_USAGE', 'HIGH_REMINDER_USAGE', 'SUDDEN_INACTIVITY', 'NO_ACTIVE_CRITICAL_STICKER', 'REPEATED_FAILED_INTERACTIONS');
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
  "siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "unitNumber" TEXT,
  "postalCode" TEXT,
  "displayAddress" TEXT NOT NULL,
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
  "displayAlias" TEXT NOT NULL,
  "status" "SeniorStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DestinationConfig" (
  "id" TEXT PRIMARY KEY,
  "destinationType" "DestinationType" NOT NULL,
  "destinationValue" TEXT NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PageConfig" (
  "id" TEXT PRIMARY KEY,
  "pageType" "PageType" NOT NULL,
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Sticker" (
  "id" TEXT PRIMARY KEY,
  "publicCode" TEXT NOT NULL UNIQUE,
  "householdId" TEXT NOT NULL REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "isCritical" BOOLEAN NOT NULL DEFAULT FALSE,
  "stickerType" "StickerType" NOT NULL,
  "runtimeMode" "RuntimeMode" NOT NULL,
  "status" "StickerStatus" NOT NULL DEFAULT 'ACTIVE',
  "destinationConfigId" TEXT UNIQUE REFERENCES "DestinationConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "pageConfigId" TEXT UNIQUE REFERENCES "PageConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "InteractionEvent" (
  "id" TEXT PRIMARY KEY,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT NOT NULL,
  "householdId" TEXT REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "seniorProfileId" TEXT REFERENCES "SeniorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "stickerId" TEXT REFERENCES "Sticker"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "publicCode" TEXT,
  "stickerType" "StickerType",
  "runtimeMode" "RuntimeMode",
  "eventType" "InteractionEventType" NOT NULL,
  "outcome" "EventOutcome" NOT NULL,
  "destinationType" "DestinationType",
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
CREATE INDEX "Sticker_householdId_status_idx" ON "Sticker"("householdId", "status");
CREATE INDEX "Sticker_siteId_status_idx" ON "Sticker"("siteId", "status");
CREATE INDEX "InteractionEvent_siteId_occurredAt_idx" ON "InteractionEvent"("siteId", "occurredAt");
CREATE INDEX "InteractionEvent_householdId_occurredAt_idx" ON "InteractionEvent"("householdId", "occurredAt");
CREATE INDEX "InteractionEvent_stickerId_occurredAt_idx" ON "InteractionEvent"("stickerId", "occurredAt");
CREATE INDEX "InteractionEvent_eventType_occurredAt_idx" ON "InteractionEvent"("eventType", "occurredAt");
CREATE INDEX "FollowUpSignal_siteId_status_lastObservedAt_idx" ON "FollowUpSignal"("siteId", "status", "lastObservedAt");
CREATE INDEX "FollowUpSignal_householdId_status_idx" ON "FollowUpSignal"("householdId", "status");
CREATE INDEX "FollowUpReview_reviewerId_status_idx" ON "FollowUpReview"("reviewerId", "status");
CREATE INDEX "FollowUpReview_householdId_status_idx" ON "FollowUpReview"("householdId", "status");
