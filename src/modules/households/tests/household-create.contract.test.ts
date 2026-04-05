import { describe, expect, it } from "vitest";
import { createHouseholdSchema } from "@/modules/households/contracts/household-create.contract";

describe("createHouseholdSchema", () => {
  it("accepts a minimal valid household payload", () => {
    const result = createHouseholdSchema.parse({
      siteId: "site-sgo-bedok",
      addressLine1: "Blk 18 Bedok South Road"
    });

    expect(result.siteId).toBe("site-sgo-bedok");
    expect(result.addressLine1).toBe("Blk 18 Bedok South Road");
  });

  it("normalizes blank optional fields to undefined", () => {
    const result = createHouseholdSchema.parse({
      siteId: "site-sgo-bedok",
      addressLine1: "Blk 18 Bedok South Road",
      addressLine2: "   ",
      unitNumber: "",
      postalCode: "   ",
      seniorDisplayName: " "
    });

    expect(result.addressLine2).toBeUndefined();
    expect(result.unitNumber).toBeUndefined();
    expect(result.postalCode).toBeUndefined();
    expect(result.seniorDisplayName).toBeUndefined();
  });

  it("rejects invalid postal codes", () => {
    expect(() =>
      createHouseholdSchema.parse({
        siteId: "site-sgo-bedok",
        addressLine1: "Blk 18 Bedok South Road",
        postalCode: "12345"
      })
    ).toThrow("Postal code must be 6 digits");
  });
});
