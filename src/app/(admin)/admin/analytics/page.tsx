import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
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

const failureReasonCopy = {
  INVALID_CODE: {
    label: "Invalid code",
    hint: "A public sticker URL did not match any valid sticker."
  },
  DISABLED_STICKER: {
    label: "Disabled sticker",
    hint: "A real sticker was scanned, but that sticker is disabled."
  },
  INVALID_DESTINATION: {
    label: "Invalid destination",
    hint: "The sticker exists, but its phone, WhatsApp, or URL destination is not valid."
  },
  MISSING_CONFIGURATION: {
    label: "Missing configuration",
    hint: "The sticker exists, but required setup details are missing."
  },
  BROKEN_LINK: {
    label: "Broken link",
    hint: "An external URL was reported as unusable. This usually comes from imported/test events unless link checking is added."
  },
  UNKNOWN: {
    label: "Unknown",
    hint: "The failure was recorded without a specific reason."
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
      subtitle="Recent runtime health and sticker interaction monitoring for TapCare."
      nav={[{ href: "/", label: "Manage households" }]}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Sites monitored"
          value={summary.siteCount}
          hint="Configured Site records included in admin monitoring."
        />
        <Link href="/admin/analytics/interactions" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Runtime events"
            value={summary.ingestionHealth.totalEvents}
            hint="Open detailed interaction records."
          />
        </Link>
        <StatCard
          label="Last 24 hours"
          value={summary.ingestionHealth.eventsLast24h}
          hint={`Subset of the last ${summary.windowHours} hours.`}
        />
        <StatCard
          label="Failure rate"
          value={`${Math.round(summary.ingestionHealth.failureRate * 100)}%`}
          hint={`Failed rows divided by all rows in the last ${summary.windowHours} hours.`}
        />
      </div>

      <Panel title="Ingestion health" eyebrow="Developer diagnostics">
        <p className="mb-4 text-sm text-muted">
          Data source: {summary.dataSource === "database" ? "Live database interaction events" : "Local demo data"}.
          Showing events since {formatSingaporeDateTime(summary.windowStartAt)}. Times are shown in Singapore time.
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

      <Panel title="Routing failures" eyebrow="Failure patterns">
        {failureEntries.length === 0 ? (
          <p className="text-sm text-muted">
            No failed runtime interactions have been recorded in the last {summary.windowHours} hours.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {failureEntries.map(([reason, count]) => (
              <div key={reason} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-sm text-muted">
                  {failureReasonCopy[reason as keyof typeof failureReasonCopy]?.label ?? reason.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
                <p className="mt-2 text-xs text-muted">
                  {failureReasonCopy[reason as keyof typeof failureReasonCopy]?.hint ?? "Failure reason from event data."}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
