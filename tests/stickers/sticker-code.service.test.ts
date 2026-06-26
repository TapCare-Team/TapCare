import { describe, expect, it } from "vitest";
import {
  buildDisplayCodeCandidate,
  generatePublicCode,
  nextDisplayCodeFromExisting
} from "@/modules/stickers/services/sticker-code.service";

describe("sticker code service", () => {
  it("uses a predictable prefix for each sticker type", () => {
    expect(buildDisplayCodeCandidate("EMERGENCY_CONTACT", 7)).toBe("EC-0007");
    expect(buildDisplayCodeCandidate("FREQUENT_CONTACT", 12)).toBe("FC-0012");
    expect(buildDisplayCodeCandidate("CHECKLIST_REMINDER", 1)).toBe("CL-0001");
    expect(buildDisplayCodeCandidate("HELP_PROFILE", 24)).toBe("HP-0024");
    expect(buildDisplayCodeCandidate("CURATED_RESOURCES", 103)).toBe("RS-0103");
  });

  it("generates opaque public codes as uuids", () => {
    expect(generatePublicCode()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("derives the next household-scoped display code from existing values in one pass", () => {
    expect(nextDisplayCodeFromExisting("HELP_PROFILE", ["HP-0001", "HP-0002", "HP-0004"])).toBe("HP-0005");
    expect(nextDisplayCodeFromExisting("EMERGENCY_CONTACT", [])).toBe("EC-0001");
  });

  it("skips existing household display codes even when they came from a previous sticker type", () => {
    expect(nextDisplayCodeFromExisting("EMERGENCY_CONTACT", ["EC-0001", "CL-0001"])).toBe("EC-0002");
  });
});
