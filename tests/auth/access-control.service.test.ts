import { describe, expect, it } from "vitest";
import {
  canAccessAdminSurface,
  canAccessCaregiverSurface
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
});
