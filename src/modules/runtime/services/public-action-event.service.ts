import type { DestinationType } from "@/modules/analytics/domain/analytics";
import type { PublicActionEventInput } from "@/modules/analytics/contracts/event-contract";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { getPublicRuntimeRepositories } from "@/modules/runtime/repositories/public-runtime.repository-provider";
import { isValidPublicCode, normalizePublicCode } from "@/modules/runtime/services/public-code.service";
import { recordRuntimeEvent } from "@/modules/runtime/services/runtime-event.service";
import { DomainError, NotFoundError } from "@/modules/shared/errors";

function hasPhoneHelpAction(record: RuntimeRecord) {
  if (record.sticker.runtimeMode !== "RENDER_PAGE" || record.sticker.page?.pageType !== "HELP_PROFILE") {
    return false;
  }

  return record.sticker.page.content.helpFields.some((field) => {
    const digitsOnly = field.value.replace(/[^\d]/g, "");
    return /\b(?:contact|call|phone)\b/i.test(field.label) && digitsOnly.length >= 8 && digitsOnly.length <= 15;
  });
}

function hasExternalLinkAction(record: RuntimeRecord) {
  if (record.sticker.runtimeMode !== "RENDER_PAGE" || !record.sticker.page) {
    return false;
  }

  if (record.sticker.page.pageType === "RESOURCES") {
    return record.sticker.page.content.links.some((link) => /^https:\/\//.test(link.href));
  }

  if (record.sticker.page.pageType === "CHECKLIST") {
    return record.sticker.page.content.checklistItems.some((item) => /https:\/\//.test(item));
  }

  return false;
}

function destinationTypeForAction(record: RuntimeRecord, actionKey: PublicActionEventInput["actionKey"]): DestinationType {
  if (actionKey === "call") {
    if (record.sticker.destination?.type === "PHONE" || hasPhoneHelpAction(record)) {
      return "PHONE";
    }
  }

  if (actionKey === "whatsapp" && record.sticker.destination?.type === "WHATSAPP") {
    return "WHATSAPP";
  }

  if (actionKey === "open_link" && hasExternalLinkAction(record)) {
    return "EXTERNAL_URL";
  }

  throw new DomainError("This action is not available for the selected sticker.", 422, "PUBLIC_ACTION_NOT_AVAILABLE");
}

export async function recordPublicActionClick(input: PublicActionEventInput) {
  const publicCode = normalizePublicCode(input.publicCode);

  if (!isValidPublicCode(publicCode)) {
    throw new DomainError("Public sticker code is invalid.", 400, "INVALID_PUBLIC_CODE");
  }

  const { runtimeRepository } = getPublicRuntimeRepositories();
  const record = await runtimeRepository.getByPublicCode(publicCode);

  if (!record) {
    throw new NotFoundError("Public sticker could not be found.", "PUBLIC_STICKER_NOT_FOUND");
  }

  if (record.sticker.status !== "ACTIVE") {
    throw new DomainError("This TapCare sticker is currently disabled.", 410, "PUBLIC_STICKER_DISABLED");
  }

  const destinationType = destinationTypeForAction(record, input.actionKey);

  return recordRuntimeEvent({
    publicCode,
    household: record.household,
    sticker: record.sticker,
    eventType: "PAGE_ACTION_CLICKED",
    outcome: "SUCCESS",
    destinationType,
    metadata: { actionKey: input.actionKey }
  });
}
