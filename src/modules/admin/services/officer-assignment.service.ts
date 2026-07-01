import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import {
  assignOfficerSchema,
  type AssignOfficerInput
} from "@/modules/admin/contracts/officer-assignment.contract";
import { PrismaAdminUsersRepository } from "@/modules/admin/repositories/prisma-admin-users.repository";
import { PrismaSitesRepository } from "@/modules/households/repositories/prisma-sites.repository";
import {
  ConfigurationError,
  ForbiddenError,
  NotFoundError
} from "@/modules/shared/errors";

const adminUsersRepository = new PrismaAdminUsersRepository();
const sitesRepository = new PrismaSitesRepository();

export async function listOfficerAccessForAdmin(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  if (!isDatabaseConfigured()) {
    throw new ConfigurationError("DATABASE_URL is required to manage officer access.");
  }

  const [officers, sites] = await Promise.all([
    adminUsersRepository.listOfficerAccessUsers(),
    sitesRepository.listAll()
  ]);

  return { officers, sites };
}

export async function assignOfficerForAdmin(user: SessionUser, rawInput: AssignOfficerInput) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  if (!isDatabaseConfigured()) {
    throw new ConfigurationError("DATABASE_URL is required to manage officer access.");
  }

  const input = assignOfficerSchema.parse(rawInput);
  const [targetUser, sites] = await Promise.all([
    adminUsersRepository.findActiveUserByEmail(input.email),
    sitesRepository.listAll()
  ]);

  if (!targetUser) {
    throw new NotFoundError("This staff member needs to sign up first.", "OFFICER_USER_NOT_FOUND");
  }

  if (targetUser.globalRole === "ADMIN" || targetUser.globalRole === "DEVELOPER") {
    throw new ForbiddenError("Admin and developer accounts already have full access.");
  }

  if (!sites.some((site) => site.id === input.siteId)) {
    throw new NotFoundError("Choose an existing satellite office.", "SITE_NOT_FOUND");
  }

  return adminUsersRepository.grantSiteOfficerAccess(targetUser.id, input.siteId);
}
