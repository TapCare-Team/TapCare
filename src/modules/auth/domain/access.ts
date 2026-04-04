export type UserRole = "OFFICER" | "CAREGIVER" | "ADMIN" | "DEVELOPER";

export type SessionUser = {
  id: string;
  displayName: string;
  role: UserRole;
  siteIds: string[];
  householdIds: string[];
};
