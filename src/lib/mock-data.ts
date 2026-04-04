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
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    addressLine1: "12 Bedok North Street 2",
    unitNumber: "#03-145",
    postalCode: "460012",
    displayAddress: "12 Bedok North Street 2 #03-145",
    lastActiveAt: "2025-04-03T10:00:00.000Z",
    seniorAliases: ["Mdm Lee"],
    caregiverIds: ["user-caregiver-1"],
    stickers: [
      {
        id: "sticker-1",
        publicCode: "AB12CD",
        stickerType: "EMERGENCY_CONTACT",
        runtimeMode: "DIRECT_REDIRECT",
        status: "ACTIVE",
        name: "Bathroom emergency sticker",
        isCritical: true,
        destination: {
          type: "WHATSAPP",
          value: "https://wa.me/6591234567",
          label: "Daughter A"
        }
      },
      {
        id: "sticker-2",
        publicCode: "HP11AA",
        stickerType: "HELP_PROFILE",
        runtimeMode: "RENDER_PAGE",
        status: "ACTIVE",
        name: "Wearable help profile tag",
        isCritical: true,
        page: {
          pageType: "HELP_PROFILE",
          title: "Help profile",
          content: {
            helpFields: [
              { label: "Name", value: "Mdm Lee" },
              { label: "Needs support with", value: "Memory prompts and contact details" },
              { label: "Preferred language", value: "Mandarin" }
            ]
          }
        }
      }
    ]
  },
  {
    id: "household-2",
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    addressLine1: "18 Bedok South Avenue 1",
    unitNumber: "#06-212",
    postalCode: "460018",
    displayAddress: "18 Bedok South Avenue 1 #06-212",
    lastActiveAt: "2025-03-22T08:00:00.000Z",
    seniorAliases: ["Mr Goh"],
    caregiverIds: [],
    stickers: [
      {
        id: "sticker-3",
        publicCode: "RS88QQ",
        stickerType: "CURATED_RESOURCES",
        runtimeMode: "RENDER_PAGE",
        status: "ACTIVE",
        name: "Resources sticker",
        isCritical: false,
        page: {
          pageType: "RESOURCES",
          title: "Recommended resources",
          content: {
            links: [
              { label: "Community centre", href: "https://example.org/community" },
              { label: "Support hotline", href: "https://example.org/hotline" }
            ]
          }
        }
      },
      {
        id: "sticker-4",
        publicCode: "EC55LM",
        stickerType: "EMERGENCY_CONTACT",
        runtimeMode: "DIRECT_REDIRECT",
        status: "DISABLED",
        name: "Emergency contact sticker",
        isCritical: true,
        destination: {
          type: "PHONE",
          value: "tel:+6591112222",
          label: "Neighbour helper"
        }
      }
    ]
  },
  {
    id: "household-3",
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    addressLine1: "4 Chai Chee Road",
    unitNumber: "#02-88",
    postalCode: "460004",
    displayAddress: "4 Chai Chee Road #02-88",
    lastActiveAt: "2025-04-04T08:00:00.000Z",
    seniorAliases: ["Mdm Noor"],
    caregiverIds: ["user-caregiver-1"],
    stickers: [
      {
        id: "sticker-5",
        publicCode: "CL44RT",
        stickerType: "CHECKLIST_REMINDER",
        runtimeMode: "RENDER_PAGE",
        status: "ACTIVE",
        name: "Daily reminders sticker",
        isCritical: false,
        page: {
          pageType: "CHECKLIST",
          title: "Morning reminders",
          content: {
            checklistItems: ["Drink water", "Take medication", "Call daughter at noon"]
          }
        }
      },
      {
        id: "sticker-6",
        publicCode: "FC66UV",
        stickerType: "FREQUENT_CONTACT",
        runtimeMode: "DIRECT_REDIRECT",
        status: "ACTIVE",
        name: "Frequent contact sticker",
        isCritical: false,
        destination: {
          type: "PHONE",
          value: "tel:+6598765432",
          label: "Helper D"
        }
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
    stickerId: "sticker-1",
    publicCode: "AB12CD",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS",
    destinationType: "WHATSAPP"
  },
  {
    id: "event-2",
    occurredAt: "2025-03-30T08:00:01.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-1",
    publicCode: "AB12CD",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "REDIRECT_ISSUED",
    outcome: "SUCCESS",
    destinationType: "WHATSAPP"
  },
  {
    id: "event-3",
    occurredAt: "2025-04-01T08:15:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-1",
    publicCode: "AB12CD",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS",
    destinationType: "WHATSAPP"
  },
  {
    id: "event-4",
    occurredAt: "2025-04-03T10:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-1",
    publicCode: "AB12CD",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS",
    destinationType: "WHATSAPP"
  },
  {
    id: "event-5",
    occurredAt: "2025-04-01T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-2",
    publicCode: "HP11AA",
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-6",
    occurredAt: "2025-04-01T11:00:01.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-2",
    publicCode: "HP11AA",
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    eventType: "PAGE_RENDERED",
    outcome: "SUCCESS"
  },
  {
    id: "event-7",
    occurredAt: "2025-04-02T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-2",
    publicCode: "HP11AA",
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-8",
    occurredAt: "2025-04-03T11:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-2",
    publicCode: "HP11AA",
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-9",
    occurredAt: "2025-04-04T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-1",
    stickerId: "sticker-2",
    publicCode: "HP11AA",
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-10",
    occurredAt: "2025-03-05T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-11",
    occurredAt: "2025-03-08T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-12",
    occurredAt: "2025-03-12T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-13",
    occurredAt: "2025-03-14T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-14",
    occurredAt: "2025-03-16T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-15",
    occurredAt: "2025-03-18T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-16",
    occurredAt: "2025-03-20T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-17",
    occurredAt: "2025-03-21T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-3",
    publicCode: "RS88QQ",
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-18",
    occurredAt: "2025-03-22T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-2",
    stickerId: "sticker-4",
    publicCode: "EC55LM",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "STICKER_OPENED",
    outcome: "FAILED",
    destinationType: "PHONE",
    failureReason: "DISABLED_STICKER"
  },
  {
    id: "event-19",
    occurredAt: "2025-03-30T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-20",
    occurredAt: "2025-03-30T17:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-21",
    occurredAt: "2025-03-31T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-22",
    occurredAt: "2025-03-31T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-23",
    occurredAt: "2025-04-01T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-24",
    occurredAt: "2025-04-01T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-25",
    occurredAt: "2025-04-02T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-26",
    occurredAt: "2025-04-02T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-27",
    occurredAt: "2025-04-03T08:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-28",
    occurredAt: "2025-04-03T19:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-29",
    occurredAt: "2025-04-01T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "PAGE_RENDERED",
    outcome: "FAILED",
    failureReason: "BROKEN_LINK"
  },
  {
    id: "event-30",
    occurredAt: "2025-04-02T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "PAGE_RENDERED",
    outcome: "FAILED",
    failureReason: "BROKEN_LINK"
  },
  {
    id: "event-31",
    occurredAt: "2025-04-03T09:00:00.000Z",
    siteId: "site-sgo-bedok",
    householdId: "household-3",
    stickerId: "sticker-5",
    publicCode: "CL44RT",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "PAGE_RENDERED",
    outcome: "FAILED",
    failureReason: "BROKEN_LINK"
  }
];

export const mockDerivedSignals = deriveFollowUpSignals({
  households: mockHouseholds,
  events: mockInteractionEvents
});
