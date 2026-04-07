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
});
