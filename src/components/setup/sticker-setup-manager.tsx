"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { DestinationType } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import type { DestinationConfig, PageConfig, Sticker } from "@/modules/stickers/domain/sticker";

type SetupManagerProps = {
  household: Household;
  initialStickers: Sticker[];
  canPersist: boolean;
};

type EditableSticker = {
  name: string;
  stickerType: Sticker["stickerType"];
  runtimeMode: Sticker["runtimeMode"];
  status: Sticker["status"];
  isCritical: boolean;
  destinationType: DestinationType;
  destinationLabel: string;
  destinationValue: string;
  pageType: PageConfig["pageType"];
  pageTitle: string;
  pageContentText: string;
};

function contentToText(page?: PageConfig) {
  if (!page) {
    return "";
  }

  if (page.pageType === "CHECKLIST") {
    return (page.content.checklistItems ?? []).join("\n");
  }

  if (page.pageType === "HELP_PROFILE") {
    return (page.content.helpFields ?? [])
      .map((field) => `${field.label}: ${field.value}`)
      .join("\n");
  }

  return (page.content.links ?? []).map((link) => `${link.label} | ${link.href}`).join("\n");
}

function stickerToFormState(sticker?: Sticker): EditableSticker {
  return {
    name: sticker?.name ?? "",
    stickerType: sticker?.stickerType ?? "EMERGENCY_CONTACT",
    runtimeMode: sticker?.runtimeMode ?? "DIRECT_REDIRECT",
    status: sticker?.status ?? "ACTIVE",
    isCritical: sticker?.isCritical ?? false,
    destinationType: sticker?.destination?.type ?? "WHATSAPP",
    destinationLabel: sticker?.destination?.label ?? "",
    destinationValue: sticker?.destination?.value ?? "",
    pageType: sticker?.page?.pageType ?? "CHECKLIST",
    pageTitle: sticker?.page?.title ?? "",
    pageContentText: contentToText(sticker?.page)
  };
}

function buildPageContent(pageType: PageConfig["pageType"], raw: string) {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (pageType === "CHECKLIST") {
    return { checklistItems: lines };
  }

  if (pageType === "HELP_PROFILE") {
    return {
      helpFields: lines.map((line) => {
        const [label, ...rest] = line.split(":");
        return { label: (label ?? "").trim(), value: rest.join(":").trim() };
      })
    };
  }

  return {
    links: lines.map((line) => {
      const [label, href] = line.split("|").map((part) => part.trim());
      return { label: label ?? "", href: href ?? "" };
    })
  };
}

function buildPayload(householdId: string, form: EditableSticker) {
  const base = {
    householdId,
    name: form.name.trim(),
    stickerType: form.stickerType,
    runtimeMode: form.runtimeMode,
    status: form.status,
    isCritical: form.isCritical
  };

  if (form.runtimeMode === "DIRECT_REDIRECT") {
    const destination: DestinationConfig | undefined = form.destinationValue.trim()
      ? {
          type: form.destinationType,
          value: form.destinationValue.trim(),
          label: form.destinationLabel.trim() || undefined
        }
      : undefined;

    return { ...base, destination, page: undefined };
  }

  const page: PageConfig | undefined = form.pageTitle.trim()
    ? {
        pageType: form.pageType,
        title: form.pageTitle.trim(),
        content: buildPageContent(form.pageType, form.pageContentText)
      }
    : undefined;

  return { ...base, destination: undefined, page };
}

function helperText(form: EditableSticker) {
  if (form.runtimeMode === "DIRECT_REDIRECT") {
    if (form.destinationType === "WHATSAPP") {
      return "Use a full WhatsApp link such as https://wa.me/6591234567.";
    }

    if (form.destinationType === "PHONE") {
      return "Use a tel: link such as tel:+6591234567.";
    }

    return "Use a full https:// destination.";
  }

  if (form.pageType === "CHECKLIST") {
    return "One checklist item per line.";
  }

  if (form.pageType === "HELP_PROFILE") {
    return "One help field per line in the format Label: Value.";
  }

  return "One resource per line in the format Label | https://example.org.";
}

function destinationPlaceholder(destinationType: DestinationType) {
  if (destinationType === "WHATSAPP") {
    return "Example: https://wa.me/6591234567";
  }

  if (destinationType === "PHONE") {
    return "Example: tel:+6591234567";
  }

  return "Example: https://example.org/help";
}

function pageContentPlaceholder(pageType: PageConfig["pageType"]) {
  if (pageType === "CHECKLIST") {
    return "Drink water\nTake medication\nCall daughter at noon";
  }

  if (pageType === "HELP_PROFILE") {
    return "Name: Mdm Lee\nNeeds support with: Memory prompts\nPreferred language: Mandarin";
  }

  return "Community centre | https://example.org/community\nSupport hotline | https://example.org/hotline";
}

function StickerEditor({
  title,
  householdId,
  form,
  onChange,
  onSubmit,
  actionLabel,
  busy,
  disabled
}: {
  title: string;
  householdId: string;
  form: EditableSticker;
  onChange: (patch: Partial<EditableSticker>) => void;
  onSubmit: () => void;
  actionLabel: string;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">
          {form.runtimeMode === "DIRECT_REDIRECT" ? "Opens one action right away" : "Shows a TapCare page"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-muted">
          Sticker label
          <input
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Example: Bathroom emergency sticker"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          Sticker purpose
          <select
            value={form.stickerType}
            onChange={(event) => onChange({ stickerType: event.target.value as Sticker["stickerType"] })}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          >
            <option value="EMERGENCY_CONTACT">Emergency contact</option>
            <option value="FREQUENT_CONTACT">Frequent contact</option>
            <option value="CHECKLIST_REMINDER">Checklist / reminder</option>
            <option value="HELP_PROFILE">Help profile</option>
            <option value="CURATED_RESOURCES">Curated resources</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          What should happen after tapping?
          <select
            value={form.runtimeMode}
            onChange={(event) => onChange({ runtimeMode: event.target.value as Sticker["runtimeMode"] })}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          >
            <option value="DIRECT_REDIRECT">Open one contact or link right away</option>
            <option value="RENDER_PAGE">Show a TapCare page</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          Availability
          <select
            value={form.status}
            onChange={(event) => onChange({ status: event.target.value as Sticker["status"] })}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-panel px-3 py-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isCritical}
            onChange={(event) => onChange({ isCritical: event.target.checked })}
          />
          Mark this as an important sticker
        </label>
      </div>

      {form.runtimeMode === "DIRECT_REDIRECT" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            Open with
            <select
              value={form.destinationType}
              onChange={(event) => onChange({ destinationType: event.target.value as DestinationType })}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Phone</option>
              <option value="EXTERNAL_URL">External URL</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            Contact or link name
            <input
              value={form.destinationLabel}
              onChange={(event) => onChange({ destinationLabel: event.target.value })}
              placeholder="Example: Daughter A"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
          <label className="space-y-2 text-sm text-muted md:col-span-2">
            Contact or link address
            <input
              value={form.destinationValue}
              onChange={(event) => onChange({ destinationValue: event.target.value })}
              placeholder={destinationPlaceholder(form.destinationType)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            Page style
            <select
              value={form.pageType}
              onChange={(event) => onChange({ pageType: event.target.value as PageConfig["pageType"] })}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            >
              <option value="CHECKLIST">Checklist</option>
              <option value="HELP_PROFILE">Help profile</option>
              <option value="RESOURCES">Resources</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            Page heading
            <input
              value={form.pageTitle}
              onChange={(event) => onChange({ pageTitle: event.target.value })}
              placeholder="Example: Morning reminders"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
          <label className="space-y-2 text-sm text-muted md:col-span-2">
            What should appear on the page?
            <textarea
              value={form.pageContentText}
              onChange={(event) => onChange({ pageContentText: event.target.value })}
              rows={6}
              placeholder={pageContentPlaceholder(form.pageType)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{helperText(form)}</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || disabled}
          className="rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving..." : actionLabel}
        </button>
      </div>
      <input type="hidden" value={householdId} readOnly />
    </div>
  );
}

export function StickerSetupManager({ household, initialStickers, canPersist }: SetupManagerProps) {
  const router = useRouter();
  const [stickers, setStickers] = useState<Record<string, EditableSticker>>(
    Object.fromEntries(initialStickers.map((sticker) => [sticker.id, stickerToFormState(sticker)]))
  );
  const [createForm, setCreateForm] = useState<EditableSticker>(stickerToFormState());
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStickers(Object.fromEntries(initialStickers.map((sticker) => [sticker.id, stickerToFormState(sticker)])));
  }, [initialStickers]);

  async function submitRequest(url: string, method: "POST" | "PATCH", body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Request failed");
    }
  }

  function refreshWithMessage(message: string) {
    setSuccessMessage(message);
    startTransition(() => router.refresh());
  }

  async function handleCreate() {
    setError("");
    setSuccessMessage("");
    setBusyId("create");

    try {
      await submitRequest("/api/v1/setup/stickers", "POST", buildPayload(household.id, createForm));
      setCreateForm(stickerToFormState());
      refreshWithMessage("Sticker created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create sticker");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(stickerId: string, action: "save" | "activate" | "disable") {
    setError("");
    setSuccessMessage("");
    setBusyId(`${action}:${stickerId}`);

    try {
      if (action === "save") {
        await submitRequest(`/api/v1/setup/stickers/${stickerId}`, "PATCH", buildPayload(household.id, stickers[stickerId]));
        refreshWithMessage("Sticker updated.");
      } else {
        await submitRequest(`/api/v1/setup/stickers/${stickerId}/${action}`, "POST");
        refreshWithMessage(action === "activate" ? "Sticker activated." : "Sticker disabled.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update sticker");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {!canPersist ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Setup writes require `DATABASE_URL`. The seeded dashboard can still be browsed in read-only mode.
        </div>
      ) : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <StickerEditor
        title={`Add sticker for ${household.displayAddress}`}
        householdId={household.id}
        form={createForm}
        onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
        onSubmit={handleCreate}
        actionLabel="Create sticker"
        busy={busyId === "create" || isPending}
        disabled={!canPersist}
      />

      <div className="space-y-4">
        {initialStickers.map((sticker) => (
          <div key={sticker.id} className="space-y-3 rounded-3xl border border-black/5 bg-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{sticker.name}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    {sticker.displayCode}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    {sticker.stickerType.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    {sticker.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdate(sticker.id, "activate")}
                  disabled={!canPersist || busyId === `activate:${sticker.id}` || isPending}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm text-muted transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(sticker.id, "disable")}
                  disabled={!canPersist || busyId === `disable:${sticker.id}` || isPending}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm text-muted transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Disable
                </button>
              </div>
            </div>

            <StickerEditor
              title="Edit sticker"
              householdId={household.id}
              form={stickers[sticker.id] ?? stickerToFormState(sticker)}
              onChange={(patch) =>
                setStickers((current) => ({
                  ...current,
                  [sticker.id]: { ...(current[sticker.id] ?? stickerToFormState(sticker)), ...patch }
                }))
              }
              onSubmit={() => handleUpdate(sticker.id, "save")}
              actionLabel="Save changes"
              busy={busyId === `save:${sticker.id}` || isPending}
              disabled={!canPersist}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
