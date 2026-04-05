import type {
  DestinationType,
  EventOutcome,
  FailureReason,
  InteractionEvent,
  InteractionEventType,
  RuntimeMode,
  StickerType
} from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import type { PageConfig, Sticker } from "@/modules/stickers/domain/sticker";
import type { Prisma } from "@prisma/client";

type PrismaStickerRecord = Prisma.StickerGetPayload<{
  include: {
    destinationConfig: true;
    pageConfig: true;
  };
}>;

type PrismaHouseholdRecord = Prisma.HouseholdGetPayload<{
  include: {
    site: true;
    seniors: true;
    assignments: true;
    stickers: {
      include: {
        destinationConfig: true;
        pageConfig: true;
      };
    };
  };
}>;

type PrismaInteractionEventRecord = Prisma.InteractionEventGetPayload<{}>;

function mapPageContent(content: Prisma.JsonValue): PageConfig["content"] {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }

  return content as PageConfig["content"];
}

export function mapPrismaSticker(sticker: PrismaStickerRecord): Sticker {
  return {
    id: sticker.id,
    displayCode: sticker.displayCode,
    publicCode: sticker.publicCode,
    stickerType: sticker.stickerType as StickerType,
    runtimeMode: sticker.runtimeMode as RuntimeMode,
    status: sticker.status,
    name: sticker.name,
    isCritical: sticker.isCritical,
    destination: sticker.destinationConfig
      ? {
          type: sticker.destinationConfig.destinationType as DestinationType,
          value: sticker.destinationConfig.destinationValue,
          label: sticker.destinationConfig.label ?? undefined
        }
      : undefined,
    page: sticker.pageConfig
      ? {
          pageType: sticker.pageConfig.pageType,
          title: sticker.pageConfig.title,
          content: mapPageContent(sticker.pageConfig.content)
        }
      : undefined
  };
}

export function mapPrismaHousehold(household: PrismaHouseholdRecord): Household {
  return {
    id: household.id,
    siteId: household.siteId,
    siteName: household.site.name,
    addressLine1: household.addressLine1,
    addressLine2: household.addressLine2 ?? undefined,
    unitNumber: household.unitNumber ?? undefined,
    postalCode: household.postalCode ?? undefined,
    displayAddress: household.displayAddress,
    lastActiveAt: household.lastActiveAt?.toISOString(),
    seniorAliases: household.seniors.map((senior) => senior.displayAlias),
    caregiverIds: household.assignments
      .filter((assignment) => assignment.endedAt === null)
      .map((assignment) => assignment.caregiverId),
    stickers: household.stickers.map(mapPrismaSticker)
  };
}

export function mapPrismaInteractionEvent(event: PrismaInteractionEventRecord): InteractionEvent {
  return {
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    siteId: event.siteId,
    householdId: event.householdId ?? undefined,
    seniorProfileId: event.seniorProfileId ?? undefined,
    stickerId: event.stickerId ?? undefined,
    publicCode: event.publicCode ?? undefined,
    stickerType: (event.stickerType as StickerType | null) ?? undefined,
    runtimeMode: (event.runtimeMode as RuntimeMode | null) ?? undefined,
    eventType: event.eventType as InteractionEventType,
    outcome: event.outcome as EventOutcome,
    destinationType: (event.destinationType as DestinationType | null) ?? undefined,
    failureReason: (event.failureReason as FailureReason | null) ?? undefined,
    sessionTokenHash: event.sessionTokenHash ?? undefined,
    metadata:
      event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
        ? (event.metadata as InteractionEvent["metadata"])
        : undefined
  };
}
