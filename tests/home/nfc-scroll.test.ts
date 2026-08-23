import { describe, expect, it } from "vitest";

import {
  clamp01,
  progressToStage,
} from "../../src/components/home/nfc-scroll";

describe("NFC homepage scroll helpers", () => {
  it("clamps scroll progress to the 0-1 range", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.45)).toBe(0.45);
    expect(clamp01(1.5)).toBe(1);
  });

  it("maps scroll progress to the four demo stages", () => {
    expect(progressToStage(0)).toBe(0);
    expect(progressToStage(0.25)).toBe(0);

    expect(progressToStage(0.26)).toBe(1);
    expect(progressToStage(0.49)).toBe(1);

    expect(progressToStage(0.5)).toBe(2);
    expect(progressToStage(0.75)).toBe(2);

    expect(progressToStage(0.76)).toBe(3);
    expect(progressToStage(1)).toBe(3);
  });
});
