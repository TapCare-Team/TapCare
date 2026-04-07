import { describe, expect, it } from "vitest";
import { filterSignalsByReason, normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";
import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";

const baseSignal: FollowUpSignal = {
  id: "signal-1",
  householdId: "household-1",
  siteId: "site-1",
  signalType: "SUDDEN_INACTIVITY",
  status: "ACTIVE",
  explanation: "No recent activity after regular use.",
  firstObservedAt: "2025-04-01T00:00:00.000Z",
  lastObservedAt: "2025-04-04T00:00:00.000Z",
  evidence: {}
};

describe("normalizeFollowUpReasonFilter", () => {
  it("accepts supported signal types and all", () => {
    expect(normalizeFollowUpReasonFilter("all")).toBe("all");
    expect(normalizeFollowUpReasonFilter("HIGH_CONTACT_USAGE")).toBe("HIGH_CONTACT_USAGE");
  });

  it("falls back to all for invalid values", () => {
    expect(normalizeFollowUpReasonFilter("invalid")).toBe("all");
    expect(normalizeFollowUpReasonFilter(undefined)).toBe("all");
  });
});

describe("filterSignalsByReason", () => {
  it("returns all signals when all is selected", () => {
    const signals = [baseSignal];

    expect(filterSignalsByReason(signals, "all")).toEqual(signals);
  });

  it("returns only matching signals for a specific follow-up reason", () => {
    const signals: FollowUpSignal[] = [
      baseSignal,
      {
        ...baseSignal,
        id: "signal-2",
        signalType: "HIGH_CONTACT_USAGE"
      }
    ];

    expect(filterSignalsByReason(signals, "HIGH_CONTACT_USAGE")).toEqual([signals[1]]);
  });
});
