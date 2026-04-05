import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canAccessOfficerSurface } from "@/modules/auth/services/access-control.service";
import { createHouseholdSchema, type CreateHouseholdInput } from "@/modules/households/contracts/household-create.contract";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { MockSitesRepository } from "@/modules/households/repositories/mock-sites.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { PrismaSitesRepository } from "@/modules/households/repositories/prisma-sites.repository";
import type { Household } from "@/modules/households/domain/household";
import {
  ConfigurationError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from "@/modules/shared/errors";
import { householdMessages } from "@/modules/shared/messages";

const prismaHouseholdsRepository = new PrismaHouseholdsRepository();
const mockHouseholdsRepository = new MockHouseholdsRepository();
const prismaSitesRepository = new PrismaSitesRepository();
const mockSitesRepository = new MockSitesRepository();

function getHouseholdsRepository() {
  return isDatabaseConfigured() ? prismaHouseholdsRepository : mockHouseholdsRepository;
}

function getSitesRepository() {
  return isDatabaseConfigured() ? prismaSitesRepository : mockSitesRepository;
}

function normalizeAddressSegment(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function buildDisplayAddress(input: Pick<CreateHouseholdInput, "addressLine1" | "addressLine2" | "unitNumber" | "postalCode">) {
  const segments = [
    normalizeAddressSegment(input.addressLine1),
    normalizeAddressSegment(input.addressLine2),
    normalizeAddressSegment(input.unitNumber),
    normalizeAddressSegment(input.postalCode)
  ].filter((value) => value.length > 0);

  return segments.join(", ");
}

async function resolveAllowedSites(user: SessionUser) {
  const repository = getSitesRepository();

  if (user.role === "ADMIN") {
    return repository.listAll();
  }

  return repository.listByIds(user.siteIds);
}

export async function listCreatableSitesForUser(user: SessionUser) {
  if (!canAccessOfficerSurface(user)) {
    throw new ForbiddenError();
  }

  return resolveAllowedSites(user);
}

export async function createHouseholdForUser(user: SessionUser, rawInput: CreateHouseholdInput): Promise<Household> {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  }

  if (!canAccessOfficerSurface(user)) {
    throw new ForbiddenError();
  }

  const input = createHouseholdSchema.parse(rawInput);
  const allowedSites = await resolveAllowedSites(user);
  const site = allowedSites.find((candidate) => candidate.id === input.siteId);

  if (!site) {
    throw new ForbiddenError(householdMessages.outOfScopeSite);
  }

  const householdsRepository = getHouseholdsRepository();
  const displayAddress = buildDisplayAddress(input);
  const existing = await householdsRepository.findDuplicateAddress(input.siteId, displayAddress);

  if (existing) {
    throw new ConflictError(householdMessages.duplicateAddress, "HOUSEHOLD_DUPLICATE_ADDRESS");
  }

  return householdsRepository.create({
    ...input,
    displayAddress
  });
}
