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
