import type { SessionUser } from "@/modules/auth/domain/access";

export function canViewHousehold(user: SessionUser, householdId: string, siteId: string) {
  if (user.role === "ADMIN" || user.role === "DEVELOPER") {
    return true;
  }

  if (user.role === "OFFICER") {
    return user.siteIds.includes(siteId);
  }

  return user.householdIds.includes(householdId);
}

export function canReviewSignals(user: SessionUser) {
  return user.role === "OFFICER" || user.role === "ADMIN";
}

export function canAccessOfficerSurface(user: SessionUser) {
  return user.role === "OFFICER" || user.role === "ADMIN";
}

export function canAccessCaregiverSurface(user: SessionUser) {
  return user.role === "CAREGIVER" || user.role === "ADMIN";
}

export function canAccessAdminSurface(user: SessionUser) {
  return user.role === "ADMIN" || user.role === "DEVELOPER";
}

export function canManageHousehold(user: SessionUser, householdId: string, siteId: string) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "OFFICER") {
    return user.siteIds.includes(siteId);
  }

  if (user.role === "CAREGIVER") {
    return user.householdIds.includes(householdId);
  }

  return false;
}
