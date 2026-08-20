import { describe, expect, it } from "vitest";
import {
  canAccessAdminSurface,
  canAccessCaregiverSurface,
  canAdministerHousehold,
  canConfigureHousehold,
  canReviewSignal,
  canViewHousehold,
  isAdmin
} from "@/modules/auth/services/access-control.service";
import type { SessionUser } from "@/modules/auth/domain/access";

function buildUser(role: SessionUser["role"]): SessionUser {
  return {
    id: `user-${role.toLowerCase()}`,
    displayName: `${role} User`,
    role,
    siteIds: [],
    householdIds: []
  };
}

describe("access-control.service", () => {
  it("keeps caregiver pages for caregiver accounts only", () => {
    expect(canAccessCaregiverSurface(buildUser("CAREGIVER"))).toBe(true);
    expect(canAccessCaregiverSurface(buildUser("ADMIN"))).toBe(false);
  });

  it("keeps admin pages for admin accounts only", () => {
    expect(canAccessAdminSurface(buildUser("ADMIN"))).toBe(true);
    expect(canAccessAdminSurface(buildUser("CAREGIVER"))).toBe(false);
  });

  it("grants admins all global household and signal capabilities", () => {
    const admin = buildUser("ADMIN");

    expect(isAdmin(admin)).toBe(true);
    expect(canViewHousehold(admin, "any-household")).toBe(true);
    expect(canConfigureHousehold(admin, "any-household")).toBe(true);
    expect(canAdministerHousehold(admin)).toBe(true);
    expect(canReviewSignal(admin)).toBe(true);
  });

  it("limits caregivers to their assigned household configuration", () => {
    const caregiver = { ...buildUser("CAREGIVER"), householdIds: ["household-a"] };

    expect(canViewHousehold(caregiver, "household-a")).toBe(true);
    expect(canConfigureHousehold(caregiver, "household-a")).toBe(true);
    expect(canViewHousehold(caregiver, "household-b")).toBe(false);
    expect(canConfigureHousehold(caregiver, "household-b")).toBe(false);
    expect(canAdministerHousehold(caregiver)).toBe(false);
    expect(canReviewSignal(caregiver)).toBe(false);
  });
});
