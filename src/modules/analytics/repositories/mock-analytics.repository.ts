import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { mockInteractionEvents } from "@/lib/mock-data";

export class MockAnalyticsRepository {
  async listEventsBySiteIds(siteIds: string[]) {
    return mockInteractionEvents.filter((event) => siteIds.includes(event.siteId));
  }

  async listEventsBySite(siteId: string) {
    return mockInteractionEvents.filter((event) => event.siteId === siteId);
  }

  async listEventsByHouseholdIds(householdIds: string[]) {
    return mockInteractionEvents.filter(
      (event) => event.householdId && householdIds.includes(event.householdId)
    );
  }

  async createEvent(event: InteractionEvent) {
    return event;
  }
}
