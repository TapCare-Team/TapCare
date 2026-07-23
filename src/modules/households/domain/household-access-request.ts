export type HouseholdAccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type HouseholdAccessRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  siteId: string;
  siteName: string;
  status: HouseholdAccessRequestStatus;
  addressLine1: string;
  addressLine2?: string;
  unitNumber?: string;
  postalCode?: string;
  displayAddress: string;
  seniorDisplayName?: string;
  requesterNote?: string;
  approvedHouseholdId?: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
};
