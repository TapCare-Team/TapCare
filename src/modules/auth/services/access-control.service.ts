import type { SessionUser } from "@/modules/auth/domain/access";

export function canViewHousehold(user: SessionUser, householdId: string, siteId: string) {
  if (user.role === "ADMIN") {
    return true;
  }

  return user.householdIds.includes(householdId);
}

export function canReviewSignals(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canAccessCaregiverSurface(user: SessionUser) {
  return user.role === "CAREGIVER";
}

export function canAccessAdminSurface(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canManageHousehold(user: SessionUser, householdId: string, siteId: string) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "CAREGIVER") {
    return user.householdIds.includes(householdId);
  }

  return false;
}
