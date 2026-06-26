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

  it("rejects addresses that do not include a number and name", () => {
    expect(() =>
      createHouseholdSchema.parse({
        siteId: "site-sgo-bedok",
        addressLine1: "Bedok"
      })
    ).toThrow("Block and street address must include both a number and a street or building name");
  });

  it("rejects unit numbers that do not start with #", () => {
    expect(() =>
      createHouseholdSchema.parse({
        siteId: "site-sgo-bedok",
        addressLine1: "Blk 18 Bedok South Road",
        unitNumber: "05-123"
      })
    ).toThrow("Unit number should look like #03-145");
  });

  it("rejects incomplete unit numbers", () => {
    expect(() =>
      createHouseholdSchema.parse({
        siteId: "site-sgo-bedok",
        addressLine1: "Blk 809 Bedok North Street 2",
        unitNumber: "#09"
      })
    ).toThrow("Unit number should look like #03-145");
  });

  it("rejects obvious placeholder household input", () => {
    const result = createHouseholdSchema.safeParse({
      siteId: "site-sgo-bedok",
      addressLine1: "809 hkhkj",
      addressLine2: "xrdcfgvhb",
      unitNumber: "#09",
      postalCode: "123456"
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Block and street address should include a recognizable street type, such as Road, Street, Avenue, Drive, Lane, or Close.",
          "Additional address details look invalid. Please enter a real landmark or leave it blank.",
          "Unit number should look like #03-145.",
          "Postal code looks like a placeholder. Please enter the actual 6-digit postal code."
        ])
      );
    }
  });
});
