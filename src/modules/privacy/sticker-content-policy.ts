import type { PageConfig } from "@/modules/stickers/domain/sticker";

export const publicStickerPrivacyGuidance = [
  "Do not enter full NRIC, FIN, passport numbers, exact medical diagnosis, full home address, unit number, or private notes.",
  "Use preferred language, safe return instructions, broad home area, and a contact button instead.",
  "Anyone with the physical sticker or QR code can open the public sticker page."
];

export const publicStickerOperationalGuidance = [
  "Stickers can be disabled immediately from household sticker setup.",
  "Public sticker codes are long random codes, not household names or serial numbers.",
  "Do not publish a list of all public sticker URLs. Share only the physical sticker or a single setup link when needed.",
  "TapCare records privacy-safe access events so admins can monitor usage and failures."
];

type SensitiveContentRule = {
  pattern: RegExp;
  message: string;
};

const sensitiveContentRules: SensitiveContentRule[] = [
  {
    pattern: /\b[stfgm]\d{7}[a-z]\b/i,
    message: "Remove full NRIC or FIN numbers from public sticker content."
  },
  {
    pattern:
      /\b(?:nric|fin|passport\s*(?:number|no\.?|#)|identity\s*card|national\s+registration)\b/i,
    message: "Do not include NRIC, FIN, passport, or identity document details on public sticker pages."
  },
  {
    pattern: /#\s*\d{1,3}\s*-\s*\d{1,5}\b/i,
    message: "Remove exact unit numbers from public sticker content. Use a broad home area instead."
  },
  {
    pattern: /\b(?:postal\s*code|singapore)\s*\d{6}\b/i,
    message: "Remove exact postal address details from public sticker content. Use a broad home area instead."
  },
  {
    pattern:
      /\b(?:blk|block|street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|lane|close|crescent)\b.*\b\d{6}\b/i,
    message: "Remove full address details from public sticker content. Use a broad home area instead."
  },
  {
    pattern: /\b(?:diagnosed\s+with|diagnosis|medical\s+diagnosis|has\s+dementia|has\s+alzheimer'?s?)\b/i,
    message: "Do not include exact medical diagnosis on public sticker pages. Use practical support instructions instead."
  },
  {
    pattern: /\b(?:private\s+note|confidential|do\s+not\s+share|secret)\b/i,
    message: "Remove private or confidential notes from public sticker content."
  }
];

export function findPublicStickerContentIssue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const rule = sensitiveContentRules.find((candidate) => candidate.pattern.test(normalized));
  return rule?.message ?? "";
}

export function pageConfigToPrivacyText(page: PageConfig) {
  if (page.pageType === "CHECKLIST") {
    return [page.title, ...page.content.checklistItems].join("\n");
  }

  if (page.pageType === "HELP_PROFILE") {
    return [
      page.title,
      ...page.content.helpFields.flatMap((field) => [field.label, field.value])
    ].join("\n");
  }

  return [
    page.title,
    ...page.content.links.flatMap((link) => [link.label, link.href])
  ].join("\n");
}

export function findPageConfigPrivacyIssue(page: PageConfig) {
  return findPublicStickerContentIssue(pageConfigToPrivacyText(page));
}
