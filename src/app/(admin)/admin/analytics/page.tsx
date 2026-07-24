import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureSnapshotGrid } from "@/components/admin/feature-snapshot-grid";
import { StickerPrivacyGuidance } from "@/components/setup/sticker-privacy-guidance";
import { requireUserWithRole } from "@/lib/auth";
import { getAdminAnalyticsSummary } from "@/modules/analytics/services/admin-analytics.service";

export const dynamic = "force-dynamic";

const singaporeDateTimeFormatter = new Intl.DateTimeFormat("en-SG", {
  timeZone: "Asia/Singapore",
  dateStyle: "medium",
  timeStyle: "medium"
});

const eventTypeCopy = {
  STICKER_OPENED: {
    label: "Sticker opened",
    hint: "A public sticker URL was opened from an NFC scan, QR scan, or direct visit."
  },
  REDIRECT_ISSUED: {
    label: "Redirect issued",
    hint: "The runtime sent the visitor to a phone, WhatsApp, or external destination."
  },
  PAGE_RENDERED: {
    label: "Page rendered",
    hint: "The runtime rendered a TapCare page instead of redirecting immediately."
  },
  PAGE_ACTION_CLICKED: {
    label: "Page action clicked",
    hint: "A visitor clicked a button or link on a rendered TapCare page."
  }
} as const;

function formatSingaporeDateTime(value: string) {
  return singaporeDateTimeFormatter.format(new Date(value));
}

export default async function AdminAnalyticsPage() {
  const user = await requireUserWithRole(["ADMIN"]);
  const summary = await getAdminAnalyticsSummary(user);
  const failureEntries = Object.entries(summary.failurePatterns.byReason).sort(([, left], [, right]) => right - left);

  return (
    <AppShell
      title="Admin Analytics"
      subtitle="System health and feature adoption for TapCare."
      nav={[{ href: "/", label: "Manage households" }]}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Sites monitored"
          value={summary.siteCount}
          hint="Configured Site records included in admin monitoring."
        />
        <StatCard
          label="Runtime events"
          value={summary.ingestionHealth.totalEvents}
          hint="All recorded InteractionEvent rows."
        />
        <StatCard
          label="Last 24 hours"
          value={summary.ingestionHealth.eventsLast24h}
          hint="InteractionEvent rows recorded in the last 24 hours."
        />
        <StatCard
          label="Failure rate"
          value={`${Math.round(summary.ingestionHealth.failureRate * 100)}%`}
          hint="Failed InteractionEvent rows divided by all recorded rows."
        />
      </div>

      <Panel title="Ingestion health" eyebrow="Developer diagnostics">
        <p className="mb-4 text-sm text-muted">
          Data source: {summary.dataSource === "database" ? "Live database interaction events" : "Local demo data"}.
          Times are shown in Singapore time.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(summary.ingestionHealth.eventCounts).map(([eventType, count]) => (
            <div key={eventType} className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-muted">{eventTypeCopy[eventType as keyof typeof eventTypeCopy].label}</p>
              <p className="mt-2 text-2xl font-semibold">{count}</p>
              <p className="mt-2 text-xs text-muted">{eventTypeCopy[eventType as keyof typeof eventTypeCopy].hint}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Last received event:{" "}
          {summary.ingestionHealth.lastEventAt
            ? formatSingaporeDateTime(summary.ingestionHealth.lastEventAt)
            : "No events yet"}
        </p>
      </Panel>

      <Panel title="Public sticker guardrails" eyebrow="Privacy and monitoring">
        <StickerPrivacyGuidance includeOperations />
      </Panel>

      <Panel title="Routing failures" eyebrow="Failure patterns">
        {failureEntries.length === 0 ? (
          <p className="text-sm text-muted">No failed runtime interactions have been recorded.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {failureEntries.map(([reason, count]) => (
              <div key={reason} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-sm text-muted">{reason.replaceAll("_", " ")}</p>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Feature adoption" eyebrow="Cross-site">
        <p className="mb-4 text-sm text-muted">
          These cards count successful sticker-open scan events by sticker purpose. They do not count how many stickers
          have been created.
        </p>
        <FeatureSnapshotGrid snapshots={summary.featureAdoption} />
      </Panel>
    </AppShell>
  );
}
