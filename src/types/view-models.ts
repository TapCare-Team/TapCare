import type { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export type AwaitedHouseholdListItem = Awaited<ReturnType<typeof getOfficerHouseholds>>[number];
