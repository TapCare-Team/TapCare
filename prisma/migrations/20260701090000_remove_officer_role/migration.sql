UPDATE "User"
SET "globalRole" = 'CAREGIVER'
WHERE "globalRole" = 'OFFICER';

UPDATE "User"
SET "globalRole" = 'ADMIN'
WHERE "globalRole" = 'DEVELOPER';

DELETE FROM "UserSiteRole"
WHERE "role" = 'SITE_OFFICER';

ALTER TABLE "User"
ALTER COLUMN "globalRole" DROP DEFAULT;

ALTER TYPE "GlobalRole" RENAME TO "GlobalRole_old";
CREATE TYPE "GlobalRole" AS ENUM ('CAREGIVER', 'ADMIN');
ALTER TABLE "User"
ALTER COLUMN "globalRole" TYPE "GlobalRole"
USING "globalRole"::text::"GlobalRole";
DROP TYPE "GlobalRole_old";

ALTER TABLE "User"
ALTER COLUMN "globalRole" SET DEFAULT 'CAREGIVER';

ALTER TYPE "SiteRole" RENAME TO "SiteRole_old";
CREATE TYPE "SiteRole" AS ENUM ('SITE_MANAGER', 'SITE_VIEWER', 'CAREGIVER_VIEWER');
ALTER TABLE "UserSiteRole"
ALTER COLUMN "role" TYPE "SiteRole"
USING "role"::text::"SiteRole";
DROP TYPE "SiteRole_old";
