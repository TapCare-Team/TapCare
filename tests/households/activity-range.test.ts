import { describe, expect, it } from "vitest";
import { normalizeActivityPreset, resolveActivityWindow } from "@/modules/households/domain/activity-range";

const anchorDate = new Date("2025-04-04T08:00:00.000Z");

describe("activity range", () => {
  it("defaults invalid presets to 7d", () => {
    expect(normalizeActivityPreset("unexpected")).toBe("7d");
  });

  it("returns an unbounded window for all", () => {
    const window = resolveActivityWindow({ preset: "all" }, anchorDate);

    expect(window.preset).toBe("all");
    expect(window.startAt).toBeNull();
    expect(window.endAt).toBeNull();
  });

  it("keeps a one-sided custom range when only from is provided", () => {
    const window = resolveActivityWindow({ preset: "custom", from: "2025-04-01" }, anchorDate);

    expect(window.startAt?.toISOString()).toBe("2025-04-01T00:00:00.000Z");
    expect(window.endAt).toBeNull();
  });

  it("keeps a one-sided custom range when only to is provided", () => {
    const window = resolveActivityWindow({ preset: "custom", to: "2025-04-01" }, anchorDate);

    expect(window.startAt).toBeNull();
    expect(window.endAt?.toISOString()).toBe("2025-04-01T23:59:59.999Z");
  });

  it("swaps reversed custom dates instead of returning an empty range", () => {
    const window = resolveActivityWindow({ preset: "custom", from: "2025-04-05", to: "2025-04-01" }, anchorDate);

    expect(window.startAt?.toISOString()).toBe("2025-04-01T00:00:00.000Z");
    expect(window.endAt?.toISOString()).toBe("2025-04-05T23:59:59.999Z");
  });

  it("ignores invalid custom dates instead of crashing the filter", () => {
    const window = resolveActivityWindow({ preset: "custom", from: "not-a-date", to: "2025-04-01" }, anchorDate);

    expect(window.startAt).toBeNull();
    expect(window.endAt?.toISOString()).toBe("2025-04-01T23:59:59.999Z");
  });
});
