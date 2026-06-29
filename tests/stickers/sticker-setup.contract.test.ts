import { describe, expect, it } from "vitest";
import { mockHouseholdIds } from "@/lib/mock-data";
import { createStickerSchema, updateStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";

describe("sticker setup contract", () => {
  it("accepts checklist page content only when checklist items are present", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "CHECKLIST_REMINDER",
      runtimeMode: "RENDER_PAGE",
      name: "Kitchen checklist",
      isCritical: false,
      page: {
        pageType: "CHECKLIST",
        title: "Morning routine",
        content: {
          checklistItems: ["Drink water", "Take medication"]
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it("accepts privacy-safe help profile content", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      name: "Wearable help tag",
      isCritical: true,
      page: {
        pageType: "HELP_PROFILE",
        title: "Help profile",
        content: {
          helpFields: [
            { label: "Name", value: "Mdm Lee" },
            { label: "Preferred language", value: "Mandarin" },
            { label: "Safe return instructions", value: "Please call her daughter and wait with her" },
            { label: "Home area", value: "Bedok North" }
          ]
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects help profile content that does not match the runtime shape", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      name: "Wearable help tag",
      isCritical: true,
      page: {
        pageType: "HELP_PROFILE",
        title: "Help profile",
        content: {
          checklistItems: ["This should not be accepted"]
        }
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects public sticker content with full identity document details", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      name: "Wearable help tag",
      isCritical: true,
      page: {
        pageType: "HELP_PROFILE",
        title: "Help profile",
        content: {
          helpFields: [
            { label: "Name", value: "Mdm Lee" },
            { label: "NRIC", value: "S1234567D" }
          ]
        }
      }
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("NRIC");
  });

  it("rejects public sticker content with exact unit address details", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "CHECKLIST_REMINDER",
      runtimeMode: "RENDER_PAGE",
      name: "Door checklist",
      isCritical: false,
      page: {
        pageType: "CHECKLIST",
        title: "Leaving home",
        content: {
          checklistItems: ["Return to Blk 123 Bedok North Street 2 #03-145"]
        }
      }
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("unit");
  });

  it("rejects resource links that are missing valid urls", () => {
    const result = updateStickerSchema.safeParse({
      page: {
        pageType: "RESOURCES",
        title: "Useful contacts",
        content: {
          links: [{ label: "Community centre", href: "not-a-url" }]
        }
      }
    });

    expect(result.success).toBe(false);
  });

  it("requires emergency contact stickers to be important direct contact actions", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "EMERGENCY_CONTACT",
      runtimeMode: "RENDER_PAGE",
      name: "Emergency contact",
      isCritical: false,
      page: {
        pageType: "HELP_PROFILE",
        title: "Wrong page",
        content: {
          helpFields: [{ label: "Name", value: "Mdm Lee" }]
        }
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts frequent contact stickers with phone contact details", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "FREQUENT_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      name: "Call son",
      isCritical: false,
      destination: {
        type: "PHONE",
        label: "Son",
        value: "tel:+6591234567"
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects contact stickers with non-numeric contact destinations", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "FREQUENT_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      name: "Call son",
      isCritical: false,
      destination: {
        type: "WHATSAPP",
        label: "Son",
        value: "https://wa.me/"
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects phone contact destinations with too few digits", () => {
    const result = createStickerSchema.safeParse({
      householdId: mockHouseholdIds.lee,
      stickerType: "EMERGENCY_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      name: "Emergency contact",
      isCritical: true,
      destination: {
        type: "PHONE",
        label: "Daughter",
        value: "tel:1234"
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects sticker updates with invalid contact numbers", () => {
    const result = updateStickerSchema.safeParse({
      stickerType: "FREQUENT_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      name: "Call son",
      isCritical: false,
      destination: {
        type: "PHONE",
        label: "Son",
        value: "tel:abcdef"
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts sticker updates with normalized phone contact destinations", () => {
    const result = updateStickerSchema.safeParse({
      stickerType: "FREQUENT_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      name: "Call son",
      isCritical: false,
      destination: {
        type: "PHONE",
        label: "Son",
        value: "tel:+6591234567"
      }
    });

    expect(result.success).toBe(true);
  });
});
