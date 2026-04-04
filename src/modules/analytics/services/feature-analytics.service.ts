import type { FeatureSnapshot, InteractionEvent, TemplateKey } from "@/modules/analytics/domain/analytics";
import { templateKeys } from "@/modules/analytics/domain/analytics";

export function buildFeatureSnapshots(events: InteractionEvent[]): FeatureSnapshot[] {
  return templateKeys.map((templateKey) => {
    const templateEvents = events.filter((event) => event.templateKey === templateKey);
    const successful = templateEvents.filter((event) => event.outcome === "success");
    const households = successful.map((event) => event.householdId).filter(Boolean) as string[];
    const perHousehold = households.reduce<Record<string, number>>((acc, householdId) => {
      acc[householdId] = (acc[householdId] ?? 0) + 1;
      return acc;
    }, {});

    return {
      templateKey,
      totalEvents: templateEvents.length,
      successfulEvents: successful.length,
      uniqueHouseholds: new Set(households).size,
      repeatHouseholds: Object.values(perHousehold).filter((count) => count > 1).length,
      failureRate:
        templateEvents.length === 0
          ? 0
          : Number((templateEvents.filter((event) => event.outcome === "failed").length / templateEvents.length).toFixed(2))
    };
  });
}

export function labelForTemplateKey(templateKey: TemplateKey) {
  return {
    emergency_contact: "Emergency contact",
    frequent_contacts: "Frequent contacts",
    reminder_checklist: "Reminder checklist",
    resource_links: "Resource links",
    help_profile: "Help profile"
  }[templateKey];
}
