import type {
  DestinationType,
  FailureReason,
  InteractionEvent,
  InteractionEventType,
  RuntimeMode,
  StickerType
} from "@/modules/analytics/domain/analytics";
import type { PageConfig } from "@/modules/stickers/domain/sticker";

export type RuntimeHouseholdSummary = {
  id: string;
  siteId: string;
  displayAddress: string;
};

export type RuntimeStickerSummary = {
  id: string;
  name: string;
  publicCode: string;
  stickerType: StickerType;
  runtimeMode: RuntimeMode;
  status: "ACTIVE" | "DISABLED";
  destination?: {
    type: DestinationType;
    value: string;
    label?: string;
  };
  page?: PageConfig;
};

export type RuntimeRecord = {
  household: RuntimeHouseholdSummary;
  sticker: RuntimeStickerSummary;
};

export type RuntimeEventContext = {
  household?: RuntimeHouseholdSummary;
  sticker?: RuntimeStickerSummary;
  publicCode: string;
};

export type RuntimeEventInput = RuntimeEventContext & {
  eventType: InteractionEventType;
  outcome: InteractionEvent["outcome"];
  destinationType?: DestinationType;
  failureReason?: FailureReason;
  metadata?: InteractionEvent["metadata"];
};

export type PublicRuntimeResolution =
  | {
      kind: "NOT_FOUND";
      publicCode: string;
    }
  | {
      kind: "DISABLED";
      publicCode: string;
      household: RuntimeHouseholdSummary;
      sticker: RuntimeStickerSummary;
    }
  | {
      kind: "DIRECT_REDIRECT";
      publicCode: string;
      household: RuntimeHouseholdSummary;
      sticker: RuntimeStickerSummary;
      destinationUrl: string;
    }
  | {
      kind: "RENDER_PAGE";
      publicCode: string;
      household: RuntimeHouseholdSummary;
      sticker: RuntimeStickerSummary;
      page: PageConfig;
    };
