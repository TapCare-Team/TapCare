import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { mockInteractionEvents } from "@/lib/mock-data";

export class MockAnalyticsRepository {
  async listEvents() {
    return mockInteractionEvents;
  }

  async listEventsSince(since: Date) {
    return mockInteractionEvents.filter((event) => new Date(event.occurredAt).getTime() >= since.getTime());
  }

  async listEventsBySiteIds(siteIds: string[]) {
    return mockInteractionEvents.filter((event) => siteIds.includes(event.siteId));
  }

  async listRecentEventsBySiteIds(siteIds: string[], since: Date) {
    return mockInteractionEvents.filter(
      (event) => siteIds.includes(event.siteId) && new Date(event.occurredAt).getTime() >= since.getTime()
    );
  }

  async listEventsBySite(siteId: string) {
    return mockInteractionEvents.filter((event) => event.siteId === siteId);
  }

  async listEventsByHouseholdIds(householdIds: string[]) {
    return mockInteractionEvents.filter(
      (event) => event.householdId && householdIds.includes(event.householdId)
    );
  }

  async listRecentEventsByHouseholdIds(householdIds: string[], since: Date) {
    return mockInteractionEvents.filter(
      (event) =>
        event.householdId &&
        householdIds.includes(event.householdId) &&
        new Date(event.occurredAt).getTime() >= since.getTime()
    );
  }

  async createEvent(event: InteractionEvent) {
    return event;
  }
}
