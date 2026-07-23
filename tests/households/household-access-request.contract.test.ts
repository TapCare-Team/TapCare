import { describe, expect, it } from "vitest";
import { requestHouseholdAccessSchema } from "@/modules/households/contracts/household-access-request.contract";

describe("requestHouseholdAccessSchema", () => {
  it("accepts a valid caregiver household request", () => {
    const parsed = requestHouseholdAccessSchema.safeParse({
      siteId: "site-sgo-bedok",
      addressLine1: "Blk 123 Bedok North Street 2",
      unitNumber: "#05-123",
      postalCode: "460123",
      seniorDisplayName: "Mdm Lim",
      requesterNote: "Please help me set up the stickers."
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unclear addresses and invalid postal codes", () => {
    const parsed = requestHouseholdAccessSchema.safeParse({
      siteId: "site-sgo-bedok",
      addressLine1: "hkhkj",
      postalCode: "abc123"
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining(["addressLine1", "postalCode"])
      );
    }
  });
});
