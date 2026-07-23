import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import {
  requestHouseholdAccessSchema,
  type RequestHouseholdAccessInput
} from "@/modules/households/contracts/household-access-request.contract";
import { PrismaHouseholdAccessRequestsRepository } from "@/modules/households/repositories/prisma-household-access-requests.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { PrismaSitesRepository } from "@/modules/households/repositories/prisma-sites.repository";
import { buildDisplayAddress } from "@/modules/households/services/household-management.service";
import { ConfigurationError, ForbiddenError, NotFoundError } from "@/modules/shared/errors";

const requestsRepository = new PrismaHouseholdAccessRequestsRepository();
const householdsRepository = new PrismaHouseholdsRepository();
const sitesRepository = new PrismaSitesRepository();

function requireDatabase() {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError("DATABASE_URL is required for household access requests.");
  }
}

export async function listRequestableSitesForCaregiver(user: SessionUser) {
  if (user.role !== "CAREGIVER") {
    throw new ForbiddenError();
  }

  requireDatabase();
  return sitesRepository.listAll();
}

export async function createHouseholdAccessRequestForCaregiver(
  user: SessionUser,
  rawInput: RequestHouseholdAccessInput
) {
  if (user.role !== "CAREGIVER") {
    throw new ForbiddenError();
  }

  requireDatabase();
  const input = requestHouseholdAccessSchema.parse(rawInput);
  const sites = await sitesRepository.listAll();

  if (!sites.some((site) => site.id === input.siteId)) {
    throw new NotFoundError("Choose an existing satellite office.", "SITE_NOT_FOUND");
  }

  const displayAddress = buildDisplayAddress(input);

  return requestsRepository.create({
    requesterId: user.id,
    siteId: input.siteId,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    unitNumber: input.unitNumber,
    postalCode: input.postalCode,
    seniorDisplayName: input.seniorDisplayName,
    requesterNote: input.requesterNote,
    displayAddress
  });
}

export async function listHouseholdAccessRequestsForCaregiver(user: SessionUser) {
  if (user.role !== "CAREGIVER") {
    throw new ForbiddenError();
  }

  requireDatabase();
  return requestsRepository.listByRequester(user.id);
}

export async function listPendingHouseholdAccessRequestsForAdmin(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  requireDatabase();
  return requestsRepository.listPending();
}

export async function approveHouseholdAccessRequestForAdmin(user: SessionUser, requestId: string) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  requireDatabase();
  const request = await requestsRepository.getPendingById(requestId);

  if (!request) {
    throw new NotFoundError("Household request not found.", "HOUSEHOLD_REQUEST_NOT_FOUND");
  }

  const existingHousehold = await householdsRepository.findDuplicateAddress(request.siteId, request.displayAddress);
  const household =
    existingHousehold ??
    await householdsRepository.create({
      siteId: request.siteId,
      addressLine1: request.addressLine1,
      addressLine2: request.addressLine2,
      unitNumber: request.unitNumber,
      postalCode: request.postalCode,
      displayAddress: request.displayAddress,
      seniorDisplayName: request.seniorDisplayName
    });

  await householdsRepository.assignCaregiver(household.id, request.requesterId);
  return requestsRepository.approve(request.id, user.id, household.id);
}

export async function rejectHouseholdAccessRequestForAdmin(user: SessionUser, requestId: string) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  requireDatabase();
  const request = await requestsRepository.getPendingById(requestId);

  if (!request) {
    throw new NotFoundError("Household request not found.", "HOUSEHOLD_REQUEST_NOT_FOUND");
  }

  return requestsRepository.reject(request.id, user.id);
}
