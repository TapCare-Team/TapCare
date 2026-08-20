import type { DestinationType, RuntimeMode, StickerType } from "@/modules/analytics/domain/analytics";

export type DestinationConfig = {
  type: DestinationType;
  value: string;
  label?: string;
};

export type ChecklistPageConfig = {
  pageType: "CHECKLIST";
  title: string;
  content: {
    checklistItems: string[];
  };
};

export type HelpProfilePageConfig = {
  pageType: "HELP_PROFILE";
  title: string;
  content: {
    helpFields: Array<{ label: string; value: string }>;
  };
};

export type ResourcesPageConfig = {
  pageType: "RESOURCES";
  title: string;
  content: {
    links: Array<{ label: string; href: string }>;
  };
};

export type PageConfig = ChecklistPageConfig | HelpProfilePageConfig | ResourcesPageConfig;

export type Sticker = {
  id: string;
  displayCode: string;
  publicCode: string;
  stickerType: StickerType;
  runtimeMode: RuntimeMode;
  status: "ACTIVE" | "DISABLED";
  name: string;
  isCritical: boolean;
  physicalTagTestedAt: string | null;
  destination?: DestinationConfig;
  page?: PageConfig;
};
