import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { getAdminInteractionEvents } from "@/modules/analytics/services/admin-analytics.service";

export const dynamic = "force-dynamic";

const singaporeDateTimeFormatter = new Intl.DateTimeFormat("en-SG", {
  timeZone: "Asia/Singapore",
  dateStyle: "medium",
  timeStyle: "medium"
});

function formatSingaporeDateTime(value: string) {
  return singaporeDateTimeFormatter.format(new Date(value));
}

function eventTypeLabel(eventType: InteractionEvent["eventType"]) {
  return eventType.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function optionalValue(value?: string | null) {
  return value && value.trim() ? value : "None";
}

export default async function AdminInteractionEventsPage() {
  const user = await requireUserWithRole(["ADMIN"]);
  const summary = await getAdminInteractionEvents(user);

  return (
    <AppShell
      title="Interaction details"
      subtitle={`Recorded sticker interactions from the last ${summary.windowHours} hours.`}
      nav={[
        { href: "/", label: "Manage households" },
        { href: "/admin/analytics", label: "Analytics" }
      ]}
    >
      <Panel
        title="Recent interactions"
        eyebrow={`${summary.events.length} events`}
        action={
          <Link className="text-sm font-semibold text-accent" href="/admin/analytics">
            Back to analytics
          </Link>
        }
      >
        <p className="mb-4 text-sm text-muted">
          Data source: {summary.dataSource === "database" ? "Live database interaction events" : "Local demo data"}.
          Showing events since {formatSingaporeDateTime(summary.windowStartAt)}. Times are shown in Singapore time.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-black/5">
          <table className="min-w-full divide-y divide-black/5 text-left text-sm">
            <thead className="bg-white text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Failure reason</th>
                <th className="px-4 py-3 font-medium">Sticker purpose</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Public code</th>
                <th className="px-4 py-3 font-medium">Household ID</th>
                <th className="px-4 py-3 font-medium">Sticker ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {summary.events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-4 py-3">{formatSingaporeDateTime(event.occurredAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{eventTypeLabel(event.eventType)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{event.outcome}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.failureReason)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.stickerType)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.destinationType)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.publicCode)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.householdId)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{optionalValue(event.stickerId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
