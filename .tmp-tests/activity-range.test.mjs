import test from "node:test";
import assert from "node:assert/strict";

function parseStartDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeActivityPreset(value) {
  if (value === "30d" || value === "all" || value === "custom" || value === "7d") {
    return value;
  }

  return "7d";
}

function resolveActivityWindow(filters, anchorDate) {
  const preset = normalizeActivityPreset(filters?.preset);

  if (preset === "all") {
    return { preset, startAt: null, endAt: null };
  }

  if (preset === "custom") {
    const rawStartAt = parseStartDate(filters?.from);
    const rawEndAt = parseEndDate(filters?.to);

    if (rawStartAt && rawEndAt && rawStartAt.getTime() > rawEndAt.getTime()) {
      return {
        preset,
        startAt: parseStartDate(filters?.to),
        endAt: parseEndDate(filters?.from)
      };
    }

    return { preset, startAt: rawStartAt, endAt: rawEndAt };
  }

  const days = preset === "30d" ? 30 : 7;
  const startAt = new Date(anchorDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  startAt.setUTCHours(0, 0, 0, 0);

  return { preset, startAt, endAt: anchorDate };
}

const anchorDate = new Date("2025-04-04T08:00:00.000Z");

test("defaults invalid presets to 7d", () => {
  assert.equal(normalizeActivityPreset("unexpected"), "7d");
});

test("returns an unbounded window for all", () => {
  const window = resolveActivityWindow({ preset: "all" }, anchorDate);

  assert.equal(window.preset, "all");
  assert.equal(window.startAt, null);
  assert.equal(window.endAt, null);
});

test("keeps a one-sided custom range when only from is provided", () => {
  const window = resolveActivityWindow({ preset: "custom", from: "2025-04-01" }, anchorDate);

  assert.equal(window.startAt?.toISOString(), "2025-04-01T00:00:00.000Z");
  assert.equal(window.endAt, null);
});

test("keeps a one-sided custom range when only to is provided", () => {
  const window = resolveActivityWindow({ preset: "custom", to: "2025-04-01" }, anchorDate);

  assert.equal(window.startAt, null);
  assert.equal(window.endAt?.toISOString(), "2025-04-01T23:59:59.999Z");
});

test("swaps reversed custom dates instead of returning an empty range", () => {
  const window = resolveActivityWindow(
    { preset: "custom", from: "2025-04-05", to: "2025-04-01" },
    anchorDate
  );

  assert.equal(window.startAt?.toISOString(), "2025-04-01T00:00:00.000Z");
  assert.equal(window.endAt?.toISOString(), "2025-04-05T23:59:59.999Z");
});

test("ignores invalid custom dates instead of crashing the filter", () => {
  const window = resolveActivityWindow({ preset: "custom", from: "not-a-date", to: "2025-04-01" }, anchorDate);

  assert.equal(window.startAt, null);
  assert.equal(window.endAt?.toISOString(), "2025-04-01T23:59:59.999Z");
});
