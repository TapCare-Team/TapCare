export const stickerTypes = [
  "EMERGENCY_CONTACT",
  "FREQUENT_CONTACT",
  "CHECKLIST_REMINDER",
  "HELP_PROFILE",
  "CURATED_RESOURCES"
] as const;

export type StickerType = (typeof stickerTypes)[number];
export type RuntimeMode = "DIRECT_REDIRECT" | "RENDER_PAGE";
export type EventOutcome = "SUCCESS" | "FAILED";
export type DestinationType = "WHATSAPP" | "PHONE" | "EXTERNAL_URL";
export type InteractionEventType =
  | "STICKER_OPENED"
  | "REDIRECT_ISSUED"
  | "PAGE_RENDERED"
  | "PAGE_ACTION_CLICKED";
export type FailureReason =
  | "INVALID_CODE"
  | "DISABLED_STICKER"
  | "INVALID_DESTINATION"
  | "MISSING_CONFIGURATION"
  | "BROKEN_LINK"
  | "UNKNOWN";

export type InteractionEvent = {
  id: string;
  occurredAt: string;
  siteId: string;
  householdId?: string;
  seniorProfileId?: string;
  stickerId?: string;
  publicCode?: string;
  stickerType?: StickerType;
  runtimeMode?: RuntimeMode;
  eventType: InteractionEventType;
  outcome: EventOutcome;
  destinationType?: DestinationType;
  failureReason?: FailureReason;
  sessionTokenHash?: string;
  metadata?: {
    actionKey?: "open_link" | "call" | "whatsapp";
  };
};

export type FeatureSnapshot = {
  stickerType: StickerType;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueHouseholds: number;
  repeatHouseholds: number;
  failureRate: number;
};
