import type { Sticker } from "@/modules/stickers/domain/sticker";

export type Household = {
  id: string;
  siteId: string;
  siteName: string;
  addressLine1: string;
  addressLine2?: string;
  unitNumber?: string;
  postalCode?: string;
  displayAddress: string;
  lastActiveAt?: string;
  seniorAliases: string[];
  caregiverIds: string[];
  caregiverAssignments: Array<{
    caregiverId: string;
    displayName: string;
    email: string;
    assignedAt: string;
  }>;
  stickers: Sticker[];
};
