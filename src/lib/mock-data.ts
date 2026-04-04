import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { SessionUser } from "@/modules/auth/domain/access";
import type { Household } from "@/modules/households/domain/household";
import { deriveFollowUpSignals } from "@/modules/signals/services/follow-up-signal.service";

export const mockUsers: Record<string, SessionUser> = {
  officer: {
    id: "user-officer-1",
    displayName: "Amina Tan",
    role: "OFFICER",
    siteIds: ["site-sgo-bedok"],
    householdIds: []
  },
  caregiver: {
    id: "user-caregiver-1",
    displayName: "Maya Lim",
    role: "CAREGIVER",
    siteIds: [],
    householdIds: ["household-1", "household-3"]
  },
  admin: {
    id: "user-admin-1",
    displayName: "Dev Admin",
    role: "ADMIN",
    siteIds: ["site-sgo-bedok"],
    householdIds: []
  }
};

export const mockHouseholds: Household[] = [
  {
    id: "household-1",
    publicCode: "TC-1001",
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    displayLabel: "Household TC-1001",
    activatedAt: "2025-03-01T08:00:00.000Z",
    lastActiveAt: "2025-04-03T10:00:00.000Z",
    seniorAliases: ["Mdm Lee"],
    caregiverIds: ["user-caregiver-1"],
    artifacts: [
      {
        id: "artifact-1",
        templateKey: "emergency_contact",
        name: "Emergency contact sticker",
        isKeySticker: true,
        activationState: "ACTIVATED",
        issuedAt: "2025-02-28T08:00:00.000Z",
        activatedAt: "2025-03-01T08:00:00.000Z"
      },
      {
        id: "artifact-2",
        templateKey: "help_profile",
        name: "Help profile sticker",
        isKeySticker: true,
        activationState: "ACTIVATED",
        issuedAt: "2025-02-28T08:00:00.000Z",
        activatedAt: "2025-03-01T08:00:00.000Z"
      }
    ]
  },
  {
    id: "household-2",
    publicCode: "TC-1002",
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    displayLabel: "Household TC-1002",
    activatedAt: "2025-02-10T08:00:00.000Z",
    lastActiveAt: "2025-03-22T08:00:00.000Z",
    seniorAliases: ["Mr Goh"],
    caregiverIds: [],
    artifacts: [
      {
        id: "artifact-3",
        templateKey: "help_profile",
        name: "Help profile sticker",
        isKeySticker: true,
        activationState: "ACTIVATED",
        issuedAt: "2025-02-08T08:00:00.000Z",
        activatedAt: "2025-02-10T08:00:00.000Z"
      }
    ]
  },
  {
    id: "household-3",
    publicCode: "TC-1003",
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    displayLabel: "Household TC-1003",
    seniorAliases: ["Mdm Noor"],
    caregiverIds: ["user-caregiver-1"],
    artifacts: [
      {
        id: "artifact-4",
        templateKey: "emergency_contact",
        name: "Emergency contact sticker",
        isKeySticker: true,
        activationState: "PROVISIONED",
        issuedAt: "2025-03-10T08:00:00.000Z"
      },
      {
        id: "artifact-5",
        templateKey: "reminder_checklist",
        name: "Daily reminders sticker",
        isKeySticker: false,
        activationState: "ACTIVATED",
        issuedAt: "2025-03-10T08:00:00.000Z",
        activatedAt: "2025-03-11T08:00:00.000Z"
      }
    ]
  }
];

export const mockInteractionEvents: InteractionEvent[] = [
  {
    id: "event-1",
    occurredAt: "2025-03-30T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "emergency_contact",
    interactionType: "page_view",
    routeType: "emergency_contact",
    outcome: "success"
  },
  {
    id: "event-2",
    occurredAt: "2025-04-01T08:15:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "emergency_contact",
    interactionType: "action_click",
    routeType: "emergency_contact",
    outcome: "success",
    metadata: { actionKey: "call" }
  },
  {
    id: "event-3",
    occurredAt: "2025-04-03T10:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "emergency_contact",
    interactionType: "page_view",
    routeType: "emergency_contact",
    outcome: "success"
  },
  {
    id: "event-4",
    occurredAt: "2025-04-01T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-5",
    occurredAt: "2025-04-02T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-6",
    occurredAt: "2025-04-03T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-7",
    occurredAt: "2025-04-04T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-8",
    occurredAt: "2025-03-05T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-9",
    occurredAt: "2025-03-08T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-10",
    occurredAt: "2025-03-12T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "success"
  },
  {
    id: "event-11",
    occurredAt: "2025-03-14T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "frequent_contacts",
    interactionType: "action_click",
    routeType: "frequent_contacts",
    outcome: "success",
    metadata: { actionKey: "call" }
  },
  {
    id: "event-12",
    occurredAt: "2025-03-16T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "frequent_contacts",
    interactionType: "action_click",
    routeType: "frequent_contacts",
    outcome: "success",
    metadata: { actionKey: "whatsapp" }
  },
  {
    id: "event-13",
    occurredAt: "2025-03-18T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-14",
    occurredAt: "2025-03-20T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "success"
  },
  {
    id: "event-14b",
    occurredAt: "2025-03-21T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "help_profile",
    interactionType: "page_view",
    routeType: "help_profile",
    outcome: "success"
  },
  {
    id: "event-14c",
    occurredAt: "2025-03-22T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "success"
  },
  {
    id: "event-15",
    occurredAt: "2025-03-30T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-16",
    occurredAt: "2025-03-30T17:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-17",
    occurredAt: "2025-03-31T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-18",
    occurredAt: "2025-03-31T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-19",
    occurredAt: "2025-04-01T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-20",
    occurredAt: "2025-04-01T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-21",
    occurredAt: "2025-04-02T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-22",
    occurredAt: "2025-04-02T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-23",
    occurredAt: "2025-04-03T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-24",
    occurredAt: "2025-04-03T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-25",
    occurredAt: "2025-04-04T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "reminder_checklist",
    interactionType: "page_view",
    routeType: "reminder_checklist",
    outcome: "success"
  },
  {
    id: "event-26",
    occurredAt: "2025-04-01T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "failed",
    failureReason: "broken_link"
  },
  {
    id: "event-27",
    occurredAt: "2025-04-02T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "failed",
    failureReason: "broken_link"
  },
  {
    id: "event-28",
    occurredAt: "2025-04-03T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    templateKey: "resource_links",
    interactionType: "page_view",
    routeType: "resource_links",
    outcome: "failed",
    failureReason: "broken_link"
  }
];

export const mockDerivedSignals = deriveFollowUpSignals({
  households: mockHouseholds,
  events: mockInteractionEvents
});
