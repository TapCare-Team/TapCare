"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityRangePreset } from "@/modules/households/domain/activity-range";

function buildHref(basePath: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function RecentActivityFilter({
  basePath,
  preset,
  from,
  to,
  minDate,
  maxDate
}: {
  basePath: string;
  preset: ActivityRangePreset;
  from?: string;
  to?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const quickFilters = [
    { value: "all", label: "All" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "custom", label: "Custom range" }
  ] as const;
  const [fromValue, setFromValue] = useState(from ?? "");
  const [toValue, setToValue] = useState(to ?? "");

  useEffect(() => {
    setFromValue(from ?? "");
    setToValue(to ?? "");
  }, [from, to, preset]);

  let validationMessage = "";

  if (preset === "custom") {
    if (fromValue && maxDate && fromValue > maxDate) {
      validationMessage = "Start date cannot be in the future.";
    } else if (toValue && maxDate && toValue > maxDate) {
      validationMessage = "End date cannot be in the future.";
    } else if (fromValue && minDate && fromValue < minDate) {
      validationMessage = "Start date must be within this household's activity history.";
    } else if (toValue && minDate && toValue < minDate) {
      validationMessage = "End date must be within this household's activity history.";
    } else if (fromValue && toValue && toValue < fromValue) {
      validationMessage = "End date cannot be earlier than start date.";
    }
  }

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        {quickFilters.map((filter) => {
          const isActive = preset === filter.value;

          return (
            <Link
              key={filter.value}
              href={
                filter.value === "custom"
                  ? buildHref(basePath, { preset: filter.value, from: from ?? "", to: to ?? "" })
                  : buildHref(basePath, { preset: filter.value })
              }
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive
                  ? "border border-accent/20 bg-accentSoft text-accent"
                  : "border border-black/10 text-muted hover:bg-panel"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {preset === "custom" ? (
        <form action={basePath} method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="preset" value="custom" />
          <label className="flex flex-col gap-2 text-sm text-muted">
            From
            <input
              type="date"
              name="from"
              value={fromValue}
              onChange={(event) => setFromValue(event.target.value)}
              min={minDate || undefined}
              max={toValue || maxDate || undefined}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            To
            <input
              type="date"
              name="to"
              value={toValue}
              onChange={(event) => setToValue(event.target.value)}
              min={fromValue || minDate || undefined}
              max={maxDate || undefined}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={validationMessage.length > 0}
            className="rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm text-accent transition hover:bg-white"
          >
            Apply date range
          </button>
          <Link
            href={buildHref(basePath, { preset: "custom", from: "", to: "" })}
            className="rounded-full border border-black/10 px-4 py-2 text-sm text-muted transition hover:bg-panel"
          >
            Reset
          </Link>
          {validationMessage ? <p className="basis-full text-sm text-red-600">{validationMessage}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
