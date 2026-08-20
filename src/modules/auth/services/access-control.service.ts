import type { SessionUser } from "@/modules/auth/domain/access";

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canViewHousehold(user: SessionUser, householdId: string) {
  return isAdmin(user) || user.householdIds.includes(householdId);
}

export function canConfigureHousehold(user: SessionUser, householdId: string) {
  return isAdmin(user) || user.householdIds.includes(householdId);
}

export function canAdministerHousehold(user: SessionUser) {
  return isAdmin(user);
}

export function canReviewSignal(user: SessionUser) {
  return isAdmin(user);
}

export function canAccessCaregiverSurface(user: SessionUser) {
  return user.role === "CAREGIVER";
}

export function canAccessAdminSurface(user: SessionUser) {
  return isAdmin(user);
}
