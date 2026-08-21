import { getDataMode, isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canAdministerHousehold } from "@/modules/auth/services/access-control.service";
import {
  assignCaregiverSchema,
  type AssignCaregiverInput
} from "@/modules/households/contracts/household-caregiver-assignment.contract";
import { createHouseholdSchema, type CreateHouseholdInput } from "@/modules/households/contracts/household-create.contract";
import { updateHouseholdSchema, type UpdateHouseholdInput } from "@/modules/households/contracts/household-update.contract";
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
  return getDataMode() === "database" ? prismaHouseholdsRepository : mockHouseholdsRepository;
}

function getSitesRepository() {
  return getDataMode() === "database" ? prismaSitesRepository : mockSitesRepository;
}

function normalizeAddressSegment(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function buildDisplayAddress(input: Pick<CreateHouseholdInput, "addressLine1" | "addressLine2" | "unitNumber" | "postalCode">) {
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

  return [];
}

export async function listCreatableSitesForUser(user: SessionUser) {
  if (!canAdministerHousehold(user)) {
    throw new ForbiddenError();
  }

  return resolveAllowedSites(user);
}

export async function createHouseholdForUser(user: SessionUser, rawInput: CreateHouseholdInput): Promise<Household> {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  }

  if (!canAdministerHousehold(user)) {
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

export async function findDuplicateHouseholdForUser(user: SessionUser, rawInput: CreateHouseholdInput) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  }

  if (!canAdministerHousehold(user)) {
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

  return householdsRepository.findDuplicateAddress(input.siteId, displayAddress);
}

export async function deleteHouseholdForUser(user: SessionUser, householdId: string) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  }

  if (!canAdministerHousehold(user)) {
    throw new ForbiddenError();
  }

  const household = await prismaHouseholdsRepository.getById(householdId);
  if (!household) {
    throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  const deleted = await prismaHouseholdsRepository.archive(householdId);
  if (!deleted) {
    throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }
}

export async function assignCaregiverToHouseholdForUser(
  user: SessionUser,
  householdId: string,
  rawInput: AssignCaregiverInput
) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  }

  if (!canAdministerHousehold(user)) {
    throw new ForbiddenError();
  }

  const input = assignCaregiverSchema.parse(rawInput);
  const household = await prismaHouseholdsRepository.getById(householdId);

  if (!household) {
    throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  const caregiver = await prismaHouseholdsRepository.findCaregiverByEmail(input.email);

  if (!caregiver) {
    throw new NotFoundError(householdMessages.caregiverNotFound, "CAREGIVER_NOT_FOUND");
  }

  const assignment = await prismaHouseholdsRepository.assignCaregiver(household.id, caregiver.id);

  if (!assignment.household) {
    throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  return {
    household: assignment.household,
    caregiver,
    alreadyAssigned: assignment.alreadyAssigned
  };
}

export async function unassignCaregiverFromHouseholdForUser(user: SessionUser, householdId: string, caregiverId: string) {
  if (!isDatabaseConfigured()) throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  if (!canAdministerHousehold(user)) throw new ForbiddenError();
  const household = await prismaHouseholdsRepository.getById(householdId);
  if (!household) throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  const unassigned = await prismaHouseholdsRepository.unassignCaregiver(householdId, caregiverId);
  if (!unassigned) throw new NotFoundError(householdMessages.caregiverNotFound, "CAREGIVER_ASSIGNMENT_NOT_FOUND");
}

export async function updateHouseholdForUser(user: SessionUser, householdId: string, rawInput: UpdateHouseholdInput) {
  if (!isDatabaseConfigured()) throw new ConfigurationError(householdMessages.databaseUnavailable, "HOUSEHOLD_DATABASE_UNAVAILABLE");
  if (!canAdministerHousehold(user)) throw new ForbiddenError();
  const input = updateHouseholdSchema.parse(rawInput);
  const household = await prismaHouseholdsRepository.getById(householdId);
  if (!household) throw new NotFoundError(householdMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  const displayAddress = buildDisplayAddress(input);
  if (await prismaHouseholdsRepository.findDuplicateAddressExcludingHousehold(household.siteId, displayAddress, householdId)) throw new ConflictError(householdMessages.duplicateAddress, "HOUSEHOLD_DUPLICATE_ADDRESS");
  return prismaHouseholdsRepository.updateHouseholdAddress(householdId, { ...input, displayAddress });
}
