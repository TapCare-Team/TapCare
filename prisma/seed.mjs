import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const demoPassword = "TapCare1234!";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, 64);

  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

const householdIds = {
  lee: "cmah1a8xk0001q9m7bedok12",
  goh: "cmah1a8xk0002q9m7bedok18",
  noor: "cmah1a8xk0003q9m7chaiche4"
};

const site = {
  id: "site-sgo-bedok",
  code: "SGO-BEDOK",
  name: "SGO Bedok",
  region: "East"
};

const users = [
  {
    id: "user-caregiver-1",
    email: "maya.lim@example.org",
    displayName: "Maya Lim",
    globalRole: "CAREGIVER",
    password: demoPassword
  },
  {
    id: "user-admin-1",
    email: "dev.admin@tapcare.sg",
    displayName: "Dev Admin",
    globalRole: "ADMIN",
    password: demoPassword
  }
];

const households = [
  {
    id: householdIds.lee,
    siteId: site.id,
    addressLine1: "12 Bedok North Street 2",
    unitNumber: "#03-145",
    postalCode: "460012",
    displayAddress: "12 Bedok North Street 2 #03-145",
    lastActiveAt: new Date("2025-04-04T08:00:00.000Z")
  },
  {
    id: householdIds.goh,
    siteId: site.id,
    addressLine1: "18 Bedok South Avenue 1",
    unitNumber: "#06-212",
    postalCode: "460018",
    displayAddress: "18 Bedok South Avenue 1 #06-212",
    lastActiveAt: new Date("2025-03-22T08:00:00.000Z")
  },
  {
    id: householdIds.noor,
    siteId: site.id,
    addressLine1: "4 Chai Chee Road",
    unitNumber: "#02-88",
    postalCode: "460004",
    displayAddress: "4 Chai Chee Road #02-88",
    lastActiveAt: new Date("2025-04-03T19:00:00.000Z")
  }
];

const seniors = [
  { id: "senior-1", householdId: householdIds.lee, displayAlias: "Mdm Lee" },
  { id: "senior-2", householdId: householdIds.goh, displayAlias: "Mr Goh" },
  { id: "senior-3", householdId: householdIds.noor, displayAlias: "Mdm Noor" }
];

const assignments = [
  {
    id: "assignment-1",
    householdId: householdIds.lee,
    caregiverId: "user-caregiver-1",
    assignedAt: new Date("2025-03-01T08:00:00.000Z")
  },
  {
    id: "assignment-2",
    householdId: householdIds.noor,
    caregiverId: "user-caregiver-1",
    assignedAt: new Date("2025-03-10T08:00:00.000Z")
  }
];

const destinationConfigs = [
  {
    id: "destination-1",
    destinationType: "WHATSAPP",
    destinationValue: "https://wa.me/6591234567",
    label: "Daughter A"
  },
  {
    id: "destination-2",
    destinationType: "PHONE",
    destinationValue: "tel:+6591112222",
    label: "Neighbour helper"
  },
  {
    id: "destination-3",
    destinationType: "PHONE",
    destinationValue: "tel:+6598765432",
    label: "Helper D"
  }
];

const pageConfigs = [
  {
    id: "page-1",
    pageType: "HELP_PROFILE",
    title: "Help profile",
    content: {
      helpFields: [
        { label: "Name", value: "Mdm Lee" },
        { label: "Needs support with", value: "Memory prompts and contact details" },
        { label: "Preferred language", value: "Mandarin" }
      ]
    }
  },
  {
    id: "page-2",
    pageType: "RESOURCES",
    title: "Recommended resources",
    content: {
      links: [
        { label: "Community centre", href: "https://example.org/community" },
        { label: "Support hotline", href: "https://example.org/hotline" }
      ]
    }
  },
  {
    id: "page-3",
    pageType: "CHECKLIST",
    title: "Morning reminders",
    content: {
      checklistItems: ["Drink water", "Take medication", "Call daughter at noon"]
    }
  }
];

const stickers = [
  {
    id: "sticker-1",
    displayCode: "EC-0001",
    publicCode: "550e8400-e29b-41d4-a716-446655440001",
    householdId: householdIds.lee,
    siteId: site.id,
    name: "Bathroom emergency sticker",
    isCritical: true,
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    status: "ACTIVE",
    destinationConfigId: "destination-1"
  },
  {
    id: "sticker-2",
    displayCode: "HP-0001",
    publicCode: "550e8400-e29b-41d4-a716-446655440002",
    householdId: householdIds.lee,
    siteId: site.id,
    name: "Wearable help profile tag",
    isCritical: true,
    stickerType: "HELP_PROFILE",
    runtimeMode: "RENDER_PAGE",
    status: "ACTIVE",
    pageConfigId: "page-1"
  },
  {
    id: "sticker-3",
    displayCode: "RS-0001",
    publicCode: "550e8400-e29b-41d4-a716-446655440003",
    householdId: householdIds.goh,
    siteId: site.id,
    name: "Resources sticker",
    isCritical: false,
    stickerType: "CURATED_RESOURCES",
    runtimeMode: "RENDER_PAGE",
    status: "ACTIVE",
    pageConfigId: "page-2"
  },
  {
    id: "sticker-4",
    displayCode: "EC-0002",
    publicCode: "550e8400-e29b-41d4-a716-446655440004",
    householdId: householdIds.goh,
    siteId: site.id,
    name: "Emergency contact sticker",
    isCritical: true,
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    status: "DISABLED",
    destinationConfigId: "destination-2"
  },
  {
    id: "sticker-5",
    displayCode: "CL-0001",
    publicCode: "550e8400-e29b-41d4-a716-446655440005",
    householdId: householdIds.noor,
    siteId: site.id,
    name: "Daily reminders sticker",
    isCritical: false,
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    status: "ACTIVE",
    pageConfigId: "page-3"
  },
  {
    id: "sticker-6",
    displayCode: "FC-0001",
    publicCode: "550e8400-e29b-41d4-a716-446655440006",
    householdId: householdIds.noor,
    siteId: site.id,
    name: "Frequent contact sticker",
    isCritical: false,
    stickerType: "FREQUENT_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    status: "ACTIVE",
    destinationConfigId: "destination-3"
  }
];

const interactionEvents = [
  ["event-1", "2025-03-30T08:00:00.000Z", householdIds.lee, "sticker-1", "550e8400-e29b-41d4-a716-446655440001", "EMERGENCY_CONTACT", "DIRECT_REDIRECT", "STICKER_OPENED", "SUCCESS", "WHATSAPP", null],
  ["event-2", "2025-03-30T08:00:01.000Z", householdIds.lee, "sticker-1", "550e8400-e29b-41d4-a716-446655440001", "EMERGENCY_CONTACT", "DIRECT_REDIRECT", "REDIRECT_ISSUED", "SUCCESS", "WHATSAPP", null],
  ["event-3", "2025-04-01T08:15:00.000Z", householdIds.lee, "sticker-1", "550e8400-e29b-41d4-a716-446655440001", "EMERGENCY_CONTACT", "DIRECT_REDIRECT", "STICKER_OPENED", "SUCCESS", "WHATSAPP", null],
  ["event-4", "2025-04-03T10:00:00.000Z", householdIds.lee, "sticker-1", "550e8400-e29b-41d4-a716-446655440001", "EMERGENCY_CONTACT", "DIRECT_REDIRECT", "STICKER_OPENED", "SUCCESS", "WHATSAPP", null],
  ["event-5", "2025-04-01T11:00:00.000Z", householdIds.lee, "sticker-2", "550e8400-e29b-41d4-a716-446655440002", "HELP_PROFILE", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-6", "2025-04-01T11:00:01.000Z", householdIds.lee, "sticker-2", "550e8400-e29b-41d4-a716-446655440002", "HELP_PROFILE", "RENDER_PAGE", "PAGE_RENDERED", "SUCCESS", null, null],
  ["event-7", "2025-04-02T11:00:00.000Z", householdIds.lee, "sticker-2", "550e8400-e29b-41d4-a716-446655440002", "HELP_PROFILE", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-8", "2025-04-03T11:00:00.000Z", householdIds.lee, "sticker-2", "550e8400-e29b-41d4-a716-446655440002", "HELP_PROFILE", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-9", "2025-04-04T08:00:00.000Z", householdIds.lee, "sticker-2", "550e8400-e29b-41d4-a716-446655440002", "HELP_PROFILE", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-10", "2025-03-05T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-11", "2025-03-08T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-12", "2025-03-12T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-13", "2025-03-14T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-14", "2025-03-16T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-15", "2025-03-18T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-16", "2025-03-20T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-17", "2025-03-21T08:00:00.000Z", householdIds.goh, "sticker-3", "550e8400-e29b-41d4-a716-446655440003", "CURATED_RESOURCES", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-18", "2025-03-22T08:00:00.000Z", householdIds.goh, "sticker-4", "550e8400-e29b-41d4-a716-446655440004", "EMERGENCY_CONTACT", "DIRECT_REDIRECT", "STICKER_OPENED", "FAILED", "PHONE", "DISABLED_STICKER"],
  ["event-19", "2025-03-30T08:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-20", "2025-03-30T17:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-21", "2025-03-31T08:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-22", "2025-03-31T19:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-23", "2025-04-01T08:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-24", "2025-04-01T19:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-25", "2025-04-02T08:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-26", "2025-04-02T19:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-27", "2025-04-03T08:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-28", "2025-04-03T19:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "STICKER_OPENED", "SUCCESS", null, null],
  ["event-29", "2025-04-01T09:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "PAGE_RENDERED", "FAILED", null, "BROKEN_LINK"],
  ["event-30", "2025-04-02T09:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "PAGE_RENDERED", "FAILED", null, "BROKEN_LINK"],
  ["event-31", "2025-04-03T09:00:00.000Z", householdIds.noor, "sticker-5", "550e8400-e29b-41d4-a716-446655440005", "CHECKLIST_REMINDER", "RENDER_PAGE", "PAGE_RENDERED", "FAILED", null, "BROKEN_LINK"]
];

async function main() {
  await prisma.site.upsert({
    where: { id: site.id },
    update: { code: site.code, name: site.name, region: site.region },
    create: site
  });

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        displayName: user.displayName,
        globalRole: user.globalRole,
        passwordHash
      },
      create: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        globalRole: user.globalRole,
        passwordHash
      },
    });
  }

  await prisma.userSiteRole.upsert({
    where: {
      userId_siteId_role: {
        userId: "user-admin-1",
        siteId: site.id,
        role: "SITE_MANAGER"
      }
    },
    update: {},
    create: {
      id: "user-site-role-2",
      userId: "user-admin-1",
      siteId: site.id,
      role: "SITE_MANAGER"
    }
  });

  for (const household of households) {
    await prisma.household.upsert({
      where: { id: household.id },
      update: household,
      create: household
    });
  }

  for (const senior of seniors) {
    await prisma.seniorProfile.upsert({
      where: { id: senior.id },
      update: senior,
      create: senior
    });
  }

  for (const assignment of assignments) {
    await prisma.householdAssignment.upsert({
      where: {
        householdId_caregiverId_assignedAt: {
          householdId: assignment.householdId,
          caregiverId: assignment.caregiverId,
          assignedAt: assignment.assignedAt
        }
      },
      update: { endedAt: null },
      create: assignment
    });
  }

  for (const destination of destinationConfigs) {
    await prisma.destinationConfig.upsert({
      where: { id: destination.id },
      update: destination,
      create: destination
    });
  }

  for (const page of pageConfigs) {
    await prisma.pageConfig.upsert({
      where: { id: page.id },
      update: page,
      create: page
    });
  }

  const stickerIdMap = new Map();
  for (const sticker of stickers) {
    const { id, ...stickerFields } = sticker;
    const seededSticker = await prisma.sticker.upsert({
      where: {
        householdId_displayCode: {
          householdId: sticker.householdId,
          displayCode: sticker.displayCode
        }
      },
      update: stickerFields,
      create: sticker
    });

    stickerIdMap.set(id, seededSticker.id);
  }

  for (const event of interactionEvents) {
    const [
      id,
      occurredAt,
      householdId,
      stickerId,
      publicCode,
      stickerType,
      runtimeMode,
      eventType,
      outcome,
      destinationType,
      failureReason
    ] = event;

    await prisma.interactionEvent.upsert({
      where: { id },
      update: {
        occurredAt: new Date(occurredAt),
        siteId: site.id,
        householdId,
        stickerId: stickerIdMap.get(stickerId) ?? stickerId,
        publicCode,
        stickerType,
        runtimeMode,
        eventType,
        outcome,
        destinationType,
        failureReason
      },
      create: {
        id,
        occurredAt: new Date(occurredAt),
        siteId: site.id,
        householdId,
        stickerId: stickerIdMap.get(stickerId) ?? stickerId,
        publicCode,
        stickerType,
        runtimeMode,
        eventType,
        outcome,
        destinationType,
        failureReason
      }
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
