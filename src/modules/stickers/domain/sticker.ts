import type { DestinationType, RuntimeMode, StickerType } from "@/modules/analytics/domain/analytics";

export type DestinationConfig = {
  type: DestinationType;
  value: string;
  label?: string;
};

export type PageConfig = {
  pageType: "CHECKLIST" | "HELP_PROFILE" | "RESOURCES";
  title: string;
  content: {
    checklistItems?: string[];
    helpFields?: Array<{ label: string; value: string }>;
    links?: Array<{ label: string; href: string }>;
  };
};

export type Sticker = {
  id: string;
  displayCode: string;
  publicCode: string;
  stickerType: StickerType;
  runtimeMode: RuntimeMode;
  status: "ACTIVE" | "DISABLED";
  name: string;
  isCritical: boolean;
  destination?: DestinationConfig;
  page?: PageConfig;
};
