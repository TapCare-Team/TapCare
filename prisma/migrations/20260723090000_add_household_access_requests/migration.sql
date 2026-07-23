CREATE TYPE "HouseholdAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "HouseholdAccessRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "approvedHouseholdId" TEXT,
  "status" "HouseholdAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "unitNumber" TEXT,
  "postalCode" TEXT,
  "displayAddress" TEXT NOT NULL,
  "seniorDisplayName" TEXT,
  "requesterNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HouseholdAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HouseholdAccessRequest_requesterId_status_idx"
ON "HouseholdAccessRequest"("requesterId", "status");

CREATE INDEX "HouseholdAccessRequest_siteId_status_idx"
ON "HouseholdAccessRequest"("siteId", "status");

CREATE INDEX "HouseholdAccessRequest_status_createdAt_idx"
ON "HouseholdAccessRequest"("status", "createdAt");

ALTER TABLE "HouseholdAccessRequest"
ADD CONSTRAINT "HouseholdAccessRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HouseholdAccessRequest"
ADD CONSTRAINT "HouseholdAccessRequest_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HouseholdAccessRequest"
ADD CONSTRAINT "HouseholdAccessRequest_approvedHouseholdId_fkey"
FOREIGN KEY ("approvedHouseholdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HouseholdAccessRequest"
ADD CONSTRAINT "HouseholdAccessRequest_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
