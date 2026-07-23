import type { getAdminHouseholds } from "@/modules/households/services/household-analytics.service";

export type AwaitedHouseholdListItem = Awaited<ReturnType<typeof getAdminHouseholds>>[number];
