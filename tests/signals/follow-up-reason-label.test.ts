import { describe, expect, it } from "vitest";
import { labelForFollowUpReason } from "@/modules/signals/domain/follow-up-reason-label";

describe("labelForFollowUpReason", () => {
  it("returns plain-language labels for officer-facing badges", () => {
    expect(labelForFollowUpReason("SUDDEN_INACTIVITY")).toBe("No recent sticker activity");
    expect(labelForFollowUpReason("REPEATED_FAILED_INTERACTIONS")).toBe("Repeated failed sticker attempts");
  });
});
