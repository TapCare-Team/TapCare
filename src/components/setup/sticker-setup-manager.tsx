"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { StickerPrivacyGuidance } from "@/components/setup/sticker-privacy-guidance";
import { PhysicalStickerSetupPanel } from "@/components/setup/physical-sticker-setup-panel";
import type { DestinationType } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { findPublicStickerContentIssue } from "@/modules/privacy/sticker-content-policy";
import type {
  ChecklistPageConfig,
  DestinationConfig,
  HelpProfilePageConfig,
  PageConfig,
  ResourcesPageConfig,
  Sticker
} from "@/modules/stickers/domain/sticker";

type SetupManagerProps = {
  household: Household;
  initialStickers: Sticker[];
  canPersist: boolean;
  mode?: "manage" | "create";
  afterCreateHref?: string;
  physicalStickerUrls?: Record<string, string>;
  previewBasePath?: string;
  setupStickerId?: string;
};

type EditableSticker = {
  name: string;
  stickerType: Sticker["stickerType"];
  status: Sticker["status"];
  isCritical: boolean;
  destinationType: Extract<DestinationType, "WHATSAPP" | "PHONE">;
  destinationLabel: string;
  destinationValue: string;
  pageTitle: string;
  pageContentText: string;
};

type StickerFieldErrors = Partial<
  Record<"name" | "destinationLabel" | "destinationValue" | "pageTitle" | "pageContentText", string>
>;

const purposeLabels: Record<Sticker["stickerType"], string> = {
  EMERGENCY_CONTACT: "Emergency contact",
  FREQUENT_CONTACT: "Frequent contact",
  CHECKLIST_REMINDER: "Checklist / reminder",
  HELP_PROFILE: "Help profile",
  CURATED_RESOURCES: "Curated resources"
};

function runtimeModeForPurpose(stickerType: Sticker["stickerType"]): Sticker["runtimeMode"] {
  return stickerType === "EMERGENCY_CONTACT" || stickerType === "FREQUENT_CONTACT"
    ? "DIRECT_REDIRECT"
    : "RENDER_PAGE";
}

function pageTypeForPurpose(stickerType: Sticker["stickerType"]): PageConfig["pageType"] {
  if (stickerType === "HELP_PROFILE") {
    return "HELP_PROFILE";
  }

  if (stickerType === "CURATED_RESOURCES") {
    return "RESOURCES";
  }

  return "CHECKLIST";
}

function defaultCriticalForPurpose(stickerType: Sticker["stickerType"]) {
  return stickerType === "EMERGENCY_CONTACT" || stickerType === "HELP_PROFILE";
}

function contactValueToInput(value?: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("tel:")) {
    return value.slice(4);
  }

  if (value.includes("wa.me/")) {
    return value.split("wa.me/")[1]?.split(/[/?#]/)[0] ?? value;
  }

  return value;
}

function contactInputToDestinationValue(destinationType: EditableSticker["destinationType"], value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  if (destinationType === "PHONE") {
    return trimmed.startsWith("+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://wa.me/${digitsOnly}`;
}

function contactInputError(value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  if (!trimmed) {
    return "Contact number is required.";
  }

  if (!/^[+\d\s()-]+$/.test(trimmed)) {
    return "Contact number can only contain digits, spaces, dashes, brackets, or a leading plus sign.";
  }

  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return "Contact number must contain 8 to 15 digits.";
  }

  return "";
}

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
  const stickerType = sticker?.stickerType ?? "EMERGENCY_CONTACT";

  return {
    name: sticker?.name ?? "",
    stickerType,
    status: sticker?.status ?? "ACTIVE",
    isCritical: sticker?.isCritical ?? defaultCriticalForPurpose(stickerType),
    destinationType:
      sticker?.destination?.type === "PHONE" || sticker?.destination?.type === "WHATSAPP"
        ? sticker.destination.type
        : "WHATSAPP",
    destinationLabel: sticker?.destination?.label ?? "",
    destinationValue: contactValueToInput(sticker?.destination?.value),
    pageTitle: sticker?.page?.title ?? "",
    pageContentText: contentToText(sticker?.page)
  };
}

function applyPurposeDefaults(form: EditableSticker, stickerType: Sticker["stickerType"]): EditableSticker {
  return {
    ...form,
    stickerType,
    isCritical: defaultCriticalForPurpose(stickerType)
  };
}

function buildPageContent(pageType: "CHECKLIST", raw: string): ChecklistPageConfig["content"];
function buildPageContent(pageType: "HELP_PROFILE", raw: string): HelpProfilePageConfig["content"];
function buildPageContent(pageType: "RESOURCES", raw: string): ResourcesPageConfig["content"];
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

function validateForm(form: EditableSticker) {
  const fieldErrors = getStickerFieldErrors(form);
  return (
    fieldErrors.name ||
    fieldErrors.destinationLabel ||
    fieldErrors.destinationValue ||
    fieldErrors.pageTitle ||
    fieldErrors.pageContentText ||
    ""
  );
}

function validateResourceLinks(raw: string) {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const invalidLine = lines.find((line) => {
    const [label, href, extra] = line.split("|").map((part) => part.trim());

    if (!label || !href || extra !== undefined) {
      return true;
    }

    try {
      const url = new URL(href);
      return url.protocol !== "http:" && url.protocol !== "https:";
    } catch {
      return true;
    }
  });

  return invalidLine ? "Resource links must use the format Label | https://example.org." : "";
}

function validateChecklistLines(raw: string) {
  const invalidChecklistLink = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .find((line) => {
      const [label, href, extra] = line.split("|").map((part) => part.trim());

      if (!label || !href || extra !== undefined) {
        return true;
      }

      try {
        const url = new URL(href);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch {
        return true;
      }
    });

  return invalidChecklistLink ? "Checklist links must use the format Label | https://example.org." : "";
}

function validateHelpProfileLines(raw: string) {
  const invalidLine = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => {
      const [label, ...rest] = line.split(":");
      return !label?.trim() || !rest.join(":").trim();
    });

  return invalidLine ? "Help profile lines must use the format Label: Value." : "";
}

function getStickerFieldErrors(form: EditableSticker): StickerFieldErrors {
  const errors: StickerFieldErrors = {};

  if (!form.name.trim()) {
    errors.name = "Sticker label is required.";
  }

  if (runtimeModeForPurpose(form.stickerType) === "DIRECT_REDIRECT") {
    if (!form.destinationLabel.trim()) {
      errors.destinationLabel = "Contact name is required.";
    }

    const contactError = contactInputError(form.destinationValue);

    if (contactError) {
      errors.destinationValue = contactError;
    }
  }

  if (runtimeModeForPurpose(form.stickerType) === "RENDER_PAGE") {
    if (!form.pageTitle.trim()) {
      errors.pageTitle = "Page heading is required.";
    }

    if (!form.pageContentText.trim()) {
      errors.pageContentText = "Page details are required.";
      return errors;
    }

    const privacyIssue = findPublicStickerContentIssue(`${form.pageTitle}\n${form.pageContentText}`);

    if (privacyIssue) {
      errors.pageContentText = privacyIssue;
      return errors;
    }
  }

  if (pageTypeForPurpose(form.stickerType) === "RESOURCES") {
    const resourceError = validateResourceLinks(form.pageContentText);

    if (resourceError) {
      errors.pageContentText = resourceError;
    }
  }

  if (pageTypeForPurpose(form.stickerType) === "CHECKLIST") {
    const checklistError = validateChecklistLines(form.pageContentText);

    if (checklistError) {
      errors.pageContentText = checklistError;
    }
  }

  if (pageTypeForPurpose(form.stickerType) === "HELP_PROFILE") {
    const helpProfileError = validateHelpProfileLines(form.pageContentText);

    if (helpProfileError) {
      errors.pageContentText = helpProfileError;
    }
  }

  return errors;
}

function buildPayload(householdId: string, form: EditableSticker) {
  const runtimeMode = runtimeModeForPurpose(form.stickerType);
  const pageType = pageTypeForPurpose(form.stickerType);
  const base = {
    householdId,
    name: form.name.trim(),
    stickerType: form.stickerType,
    runtimeMode,
    status: form.status,
    isCritical: form.stickerType === "EMERGENCY_CONTACT" ? true : form.isCritical
  };

  if (runtimeMode === "DIRECT_REDIRECT") {
    const destination: DestinationConfig = {
      type: form.destinationType,
      value: contactInputToDestinationValue(form.destinationType, form.destinationValue),
      label: form.destinationLabel.trim()
    };

    return { ...base, destination };
  }

  const page: PageConfig =
    pageType === "CHECKLIST"
      ? {
          pageType: "CHECKLIST",
          title: form.pageTitle.trim(),
          content: buildPageContent("CHECKLIST", form.pageContentText)
        }
      : pageType === "HELP_PROFILE"
        ? {
            pageType: "HELP_PROFILE",
            title: form.pageTitle.trim(),
            content: buildPageContent("HELP_PROFILE", form.pageContentText)
          }
        : {
            pageType: "RESOURCES",
            title: form.pageTitle.trim(),
            content: buildPageContent("RESOURCES", form.pageContentText)
          };

  return { ...base, page };
}

function pageContentLabel(stickerType: Sticker["stickerType"]) {
  if (stickerType === "HELP_PROFILE") {
    return "Profile information";
  }

  if (stickerType === "CURATED_RESOURCES") {
    return "Resource links";
  }

  return "Checklist or reminder details";
}

function pageContentPlaceholder(stickerType: Sticker["stickerType"]) {
  if (stickerType === "HELP_PROFILE") {
    return "Name: Mdm Lee\nPreferred language: Mandarin\nSafe return instructions: Please call her daughter and wait with her\nHome area: Bedok North\nContact: +6591234567";
  }

  if (stickerType === "CURATED_RESOURCES") {
    return "Community centre | https://example.org/community\nSupport hotline | https://example.org/hotline";
  }

  return "Bring keys\nBring wallet\nBring phone\nPhysiotherapy appointment: Friday at 10am\nStretching video | https://youtube.com/example\nClinic booking | https://example.org/appointment";
}

function helperText(form: EditableSticker) {
  if (form.stickerType === "EMERGENCY_CONTACT") {
    return "Emergency contact stickers are always marked important and open the chosen contact immediately.";
  }

  if (form.stickerType === "FREQUENT_CONTACT") {
    return "Frequent contact stickers open the chosen contact immediately.";
  }

  if (form.stickerType === "HELP_PROFILE") {
    return "Use one field per line in the format Label: Value. Contact fields render as call buttons; prefer safe return instructions over private medical or address details.";
  }

  if (form.stickerType === "CURATED_RESOURCES") {
    return "Use one resource per line in the format Label | https://example.org.";
  }

  return "Use one checklist item or reminder per line. For clickable links, use Label | https://example.org.";
}

function StickerEditor({
  title,
  householdId,
  form,
  onChange,
  onSubmit,
  actionLabel,
  validationError,
  busy,
  disabled
}: {
  title: string;
  householdId: string;
  form: EditableSticker;
  onChange: (patch: Partial<EditableSticker> | EditableSticker) => void;
  onSubmit: () => void;
  actionLabel: string;
  validationError?: string;
  busy: boolean;
  disabled: boolean;
}) {
  const isContactSticker = runtimeModeForPurpose(form.stickerType) === "DIRECT_REDIRECT";
  const isEmergencyContact = form.stickerType === "EMERGENCY_CONTACT";
  const liveFieldErrors = getStickerFieldErrors(form);
  const submitOnlyError =
    validationError &&
    !Object.values(liveFieldErrors).some((fieldError) => fieldError === validationError)
      ? validationError
      : "";

  return (
    <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">
          {isContactSticker ? "Opens one contact action right away." : "Shows a TapCare information page."}
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
          {liveFieldErrors.name ? <span className="block text-sm text-red-600">{liveFieldErrors.name}</span> : null}
        </label>
        <label className="space-y-2 text-sm text-muted">
          Sticker purpose
          <select
            value={form.stickerType}
            onChange={(event) =>
              onChange(applyPurposeDefaults(form, event.target.value as Sticker["stickerType"]))
            }
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          >
            {Object.entries(purposeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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
        {isEmergencyContact ? (
          <div className="rounded-xl border border-accent/20 bg-accentSoft px-3 py-2 text-sm text-accent">
            Emergency contact stickers are automatically marked important.
          </div>
        ) : (
          <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-panel px-3 py-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isCritical}
              onChange={(event) => onChange({ isCritical: event.target.checked })}
            />
            Mark this as an important sticker
          </label>
        )}
      </div>

      {isContactSticker ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            Contact method
            <select
              value={form.destinationType}
              onChange={(event) =>
                onChange({ destinationType: event.target.value as EditableSticker["destinationType"] })
              }
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Phone call</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            Contact name
            <input
              value={form.destinationLabel}
              onChange={(event) => onChange({ destinationLabel: event.target.value })}
              placeholder="Example: Daughter A"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
            {liveFieldErrors.destinationLabel ? (
              <span className="block text-sm text-red-600">{liveFieldErrors.destinationLabel}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-muted md:col-span-2">
            Contact number
            <input
              value={form.destinationValue}
              onChange={(event) => onChange({ destinationValue: event.target.value })}
              placeholder="Example: +6591234567"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
            {liveFieldErrors.destinationValue ? (
              <span className="block text-sm text-red-600">{liveFieldErrors.destinationValue}</span>
            ) : null}
          </label>
        </div>
      ) : (
        <div className="grid gap-4">
          <StickerPrivacyGuidance compact />
          <label className="space-y-2 text-sm text-muted">
            Page heading
            <input
              value={form.pageTitle}
              onChange={(event) => onChange({ pageTitle: event.target.value })}
              placeholder={
                form.stickerType === "HELP_PROFILE"
                  ? "Example: Help profile"
                  : form.stickerType === "CURATED_RESOURCES"
                    ? "Example: Useful support links"
                    : "Example: Door checklist"
              }
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
            {liveFieldErrors.pageTitle ? (
              <span className="block text-sm text-red-600">{liveFieldErrors.pageTitle}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            {pageContentLabel(form.stickerType)}
            <textarea
              value={form.pageContentText}
              onChange={(event) => onChange({ pageContentText: event.target.value })}
              rows={7}
              placeholder={pageContentPlaceholder(form.stickerType)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
            />
            {liveFieldErrors.pageContentText ? (
              <span className="block text-sm text-red-600">{liveFieldErrors.pageContentText}</span>
            ) : null}
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
      {submitOnlyError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitOnlyError}
        </div>
      ) : null}
      <input type="hidden" value={householdId} readOnly />
    </div>
  );
}

export function StickerSetupManager({
  household,
  initialStickers,
  canPersist,
  mode = "manage",
  afterCreateHref,
  physicalStickerUrls = {},
  previewBasePath,
  setupStickerId
}: SetupManagerProps) {
  const router = useRouter();
  const [stickers, setStickers] = useState<Record<string, EditableSticker>>(
    Object.fromEntries(initialStickers.map((sticker) => [sticker.id, stickerToFormState(sticker)]))
  );
  const [createForm, setCreateForm] = useState<EditableSticker>(stickerToFormState());
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [savedStickerId, setSavedStickerId] = useState<string | null>(null);
  const [physicalSetupStickerId, setPhysicalSetupStickerId] = useState<string | null>(setupStickerId ?? null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStickers(Object.fromEntries(initialStickers.map((sticker) => [sticker.id, stickerToFormState(sticker)])));
  }, [initialStickers]);

  useEffect(() => {
    setPhysicalSetupStickerId(setupStickerId ?? null);
  }, [setupStickerId]);

  async function submitRequest(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    fallbackMessage: string,
    body?: unknown
  ) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(
        response.status === 401
          ? "Your sign-in session expired. Please sign in again and retry."
          : payload?.error ?? fallbackMessage
      );
    }
  }

  function refreshWithMessage(message: string) {
    setSuccessMessage(message);
    startTransition(() => router.refresh());
  }

  async function handleCreate() {
    setError("");
    setSuccessMessage("");
    setFormErrors((current) => ({ ...current, create: "" }));
    const validationError = validateForm(createForm);

    if (validationError) {
      setFormErrors((current) => ({ ...current, create: validationError }));
      return;
    }

    setBusyId("create");

    try {
      const response = await fetch("/api/v1/setup/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(household.id, createForm))
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to create sticker. Please check the details and try again.");
      }
      const created = (await response.json()) as Sticker;
      setCreateForm(stickerToFormState());
      setSavedStickerId(null);
      if (afterCreateHref) {
        router.replace(`${afterCreateHref}?setupSticker=${created.id}`);
        return;
      }
      refreshWithMessage("Sticker created.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create sticker. Please check the details and try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(stickerId: string) {
    setError("");
    setSuccessMessage("");
    setFormErrors((current) => ({ ...current, [stickerId]: "" }));

    const validationError = validateForm(stickers[stickerId] ?? stickerToFormState());

    if (validationError) {
      setFormErrors((current) => ({ ...current, [stickerId]: validationError }));
      return;
    }

    setBusyId(`save:${stickerId}`);

    try {
      await submitRequest(
        `/api/v1/setup/stickers/${stickerId}`,
        "PATCH",
        "Unable to save sticker changes. Please check the details and try again.",
        buildPayload(household.id, stickers[stickerId])
      );
      setDeleteCandidateId(null);
      setSavedStickerId(stickerId);
      refreshWithMessage("Sticker updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save sticker changes. Please check the details and try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(stickerId: string) {
    setError("");
    setSuccessMessage("");
    setBusyId(`delete:${stickerId}`);

    try {
      await submitRequest(
        `/api/v1/setup/stickers/${stickerId}`,
        "DELETE",
        "Unable to delete sticker. Please try again."
      );
      setDeleteCandidateId(null);
      setSavedStickerId(null);
      refreshWithMessage("Sticker deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete sticker. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {!canPersist ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sticker setup is currently read-only because the database is not connected. Please contact TapCare support.
        </div>
      ) : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {mode === "create" ? (
        <StickerEditor
          title={`Add sticker for ${household.displayAddress}`}
          householdId={household.id}
          form={createForm}
          onChange={(patch) => {
            setCreateForm((current) => ({ ...current, ...patch }));
            setFormErrors((current) => ({ ...current, create: "" }));
          }}
          onSubmit={handleCreate}
          actionLabel="Create sticker"
          validationError={formErrors.create}
          busy={busyId === "create" || isPending}
          disabled={!canPersist}
        />
      ) : null}

      {mode === "manage" ? (
        <div className="space-y-4">
          {initialStickers.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-muted">
              No stickers have been created for this household yet.
            </div>
          ) : null}
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
                    {purposeLabels[sticker.stickerType]}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    {sticker.status}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    Physical tag: {sticker.physicalTagTestedAt ? "Tested" : "Not tested"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {physicalStickerUrls[sticker.id] ? (
                  <button
                    type="button"
                    onClick={() => setPhysicalSetupStickerId(sticker.id)}
                    className="rounded-full border border-accent/30 bg-accentSoft px-4 py-2 text-sm text-accent transition hover:bg-white"
                  >
                    {sticker.physicalTagTestedAt ? "View physical setup" : "Set up physical sticker"}
                  </button>
                ) : null}
                {previewBasePath ? (
                  <a
                    href={`${previewBasePath}/${sticker.id}/preview`}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm text-muted transition hover:bg-white"
                  >
                    Preview sticker
                  </a>
                ) : null}
                {sticker.physicalTagTestedAt ? (
                  <p className="max-w-xs self-center text-sm text-muted">
                    Reset physical setup before deleting this tested sticker.
                  </p>
                ) : deleteCandidateId === sticker.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateId(null)}
                      disabled={busyId === `delete:${sticker.id}` || isPending}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm text-muted transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sticker.id)}
                      disabled={!canPersist || busyId === `delete:${sticker.id}` || isPending}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === `delete:${sticker.id}` ? "Deleting..." : "Confirm delete"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(sticker.id)}
                    disabled={!canPersist || isPending}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete sticker
                  </button>
                )}
              </div>
            </div>
            {physicalStickerUrls[sticker.id] && physicalSetupStickerId === sticker.id ? (
              <PhysicalStickerSetupPanel
                sticker={sticker}
                nfcUrl={physicalStickerUrls[sticker.id]}
                onChanged={() => refreshWithMessage("Physical tag setup updated.")}
              />
            ) : null}
            {deleteCandidateId === sticker.id ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                This removes the sticker setup for &quot;{sticker.name}&quot;. Historical interaction events are kept for
                analytics.
              </div>
            ) : null}

            <StickerEditor
              title="Edit sticker"
              householdId={household.id}
              form={stickers[sticker.id] ?? stickerToFormState(sticker)}
              onChange={(patch) => {
                setStickers((current) => ({
                  ...current,
                  [sticker.id]: { ...(current[sticker.id] ?? stickerToFormState(sticker)), ...patch }
                }));
                setFormErrors((current) => ({ ...current, [sticker.id]: "" }));
                setSavedStickerId((current) => (current === sticker.id ? null : current));
              }}
              onSubmit={() => handleUpdate(sticker.id)}
              actionLabel={savedStickerId === sticker.id ? "Saved" : "Save changes"}
              validationError={formErrors[sticker.id]}
              busy={busyId === `save:${sticker.id}` || isPending}
              disabled={!canPersist}
            />
          </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
