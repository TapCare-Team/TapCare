import type { TemplateKey } from "@/modules/analytics/domain/analytics";

export type CareArtifact = {
  id: string;
  templateKey: TemplateKey;
  name: string;
  isKeySticker: boolean;
  activationState: "PROVISIONED" | "ACTIVATED" | "ARCHIVED";
  issuedAt: string;
  activatedAt?: string;
};

export type Household = {
  id: string;
  publicCode: string;
  siteId: string;
  siteName: string;
  displayLabel: string;
  activatedAt?: string;
  lastActiveAt?: string;
  seniorAliases: string[];
  caregiverIds: string[];
  artifacts: CareArtifact[];
};
