export type ActivityRangePreset = "7d" | "30d" | "all" | "custom";

export type HouseholdDetailFilters = {
  preset?: ActivityRangePreset;
  from?: string;
  to?: string;
};

function toDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

function parseStartDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeActivityPreset(value?: string): ActivityRangePreset {
  if (value === "30d" || value === "all" || value === "custom" || value === "7d") {
    return value;
  }

  return "7d";
}

export function resolveActivityWindow(filters: HouseholdDetailFilters | undefined, anchorDate: Date) {
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

export function toActivityWindowFormValues(
  window: { preset: ActivityRangePreset; startAt: Date | null; endAt: Date | null }
) {
  if (window.preset !== "custom") {
    return { from: "", to: "" };
  }

  return {
    from: toDateInputValue(window.startAt),
    to: toDateInputValue(window.endAt)
  };
}

export function getSearchParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
