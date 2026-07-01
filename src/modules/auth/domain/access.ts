export type UserRole = "CAREGIVER" | "ADMIN";

export type SessionUser = {
  id: string;
  displayName: string;
  role: UserRole;
  siteIds: string[];
  householdIds: string[];
};
