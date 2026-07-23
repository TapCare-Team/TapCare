import { prisma } from "@/lib/db/prisma";
import type { HouseholdAccessRequest } from "@/modules/households/domain/household-access-request";

const requestInclude = {
  requester: true,
  site: true
} as const;

function mapRequest(request: {
  id: string;
  requesterId: string;
  siteId: string;
  approvedHouseholdId: string | null;
  status: HouseholdAccessRequest["status"];
  addressLine1: string;
  addressLine2: string | null;
  unitNumber: string | null;
  postalCode: string | null;
  displayAddress: string;
  seniorDisplayName: string | null;
  requesterNote: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  requester: {
    displayName: string;
    email: string;
  };
  site: {
    name: string;
  };
}): HouseholdAccessRequest {
  return {
    id: request.id,
    requesterId: request.requesterId,
    requesterName: request.requester.displayName,
    requesterEmail: request.requester.email,
    siteId: request.siteId,
    siteName: request.site.name,
    status: request.status,
    addressLine1: request.addressLine1,
    addressLine2: request.addressLine2 ?? undefined,
    unitNumber: request.unitNumber ?? undefined,
    postalCode: request.postalCode ?? undefined,
    displayAddress: request.displayAddress,
    seniorDisplayName: request.seniorDisplayName ?? undefined,
    requesterNote: request.requesterNote ?? undefined,
    approvedHouseholdId: request.approvedHouseholdId ?? undefined,
    reviewedById: request.reviewedById ?? undefined,
    reviewedAt: request.reviewedAt?.toISOString(),
    createdAt: request.createdAt.toISOString()
  };
}

export class PrismaHouseholdAccessRequestsRepository {
  async create(input: {
    requesterId: string;
    siteId: string;
    addressLine1: string;
    addressLine2?: string;
    unitNumber?: string;
    postalCode?: string;
    displayAddress: string;
    seniorDisplayName?: string;
    requesterNote?: string;
  }) {
    const request = await prisma.householdAccessRequest.create({
      data: input,
      include: requestInclude
    });

    return mapRequest(request);
  }

  async listByRequester(requesterId: string) {
    const requests = await prisma.householdAccessRequest.findMany({
      where: { requesterId },
      include: requestInclude,
      orderBy: { createdAt: "desc" }
    });

    return requests.map(mapRequest);
  }

  async listPending() {
    const requests = await prisma.householdAccessRequest.findMany({
      where: { status: "PENDING" },
      include: requestInclude,
      orderBy: { createdAt: "asc" }
    });

    return requests.map(mapRequest);
  }

  async getPendingById(requestId: string) {
    const request = await prisma.householdAccessRequest.findFirst({
      where: {
        id: requestId,
        status: "PENDING"
      },
      include: requestInclude
    });

    return request ? mapRequest(request) : null;
  }

  async approve(requestId: string, reviewerId: string, householdId: string) {
    const request = await prisma.householdAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        approvedHouseholdId: householdId
      },
      include: requestInclude
    });

    return mapRequest(request);
  }

  async reject(requestId: string, reviewerId: string) {
    const request = await prisma.householdAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: reviewerId,
        reviewedAt: new Date()
      },
      include: requestInclude
    });

    return mapRequest(request);
  }
}
