export const templateKeys = [
  "emergency_contact",
  "frequent_contacts",
  "reminder_checklist",
  "resource_links",
  "help_profile"
] as const;

export type TemplateKey = (typeof templateKeys)[number];
export type InteractionType = "tap" | "qr_scan" | "page_view" | "action_click";
export type EventOutcome = "success" | "failed" | "abandoned";
export type FailureReason =
  | "invalid_code"
  | "expired_route"
  | "permission_denied"
  | "broken_link"
  | "network_error"
  | "unknown";

export type InteractionEvent = {
  id: string;
  occurredAt: string;
  siteId: string;
  householdId?: string;
  seniorProfileId?: string;
  artifactId?: string;
  templateKey: TemplateKey;
  interactionType: InteractionType;
  routeType: TemplateKey;
  outcome: EventOutcome;
  failureReason?: FailureReason;
  sessionTokenHash?: string;
  metadata?: {
    actionKey?: "call" | "whatsapp" | "open_link" | "check_item";
    checklistItemCount?: number;
  };
};

export type FeatureSnapshot = {
  templateKey: TemplateKey;
  totalEvents: number;
  successfulEvents: number;
  uniqueHouseholds: number;
  repeatHouseholds: number;
  failureRate: number;
};
