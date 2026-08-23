export type NfcDemoStage = 0 | 1 | 2 | 3;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function progressToStage(progress: number): NfcDemoStage {
  const value = clamp01(progress);

  if (value < 0.26) return 0;
  if (value < 0.5) return 1;
  if (value < 0.76) return 2;

  return 3;
}
