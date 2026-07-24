import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import {
  type PublicActionTrackingContext,
  TrackedPublicActionLink
} from "@/components/runtime/tracked-public-action-link";
import { loadPublicRuntime } from "@/modules/runtime/controllers/public-runtime.controller";

export const dynamic = "force-dynamic";

function TelRedirectPage({ href, tracking }: { href: string; tracking: PublicActionTrackingContext }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <Script id="tapcare-tel-redirect" strategy="afterInteractive">
        {`window.location.replace(${JSON.stringify(href)});`}
      </Script>
      <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-panel">
        <p className="font-medium">Opening contact action...</p>
        <TrackedPublicActionLink className="mt-3 inline-block text-sm font-medium text-accent" href={href} tracking={tracking}>
          Continue if nothing happens
        </TrackedPublicActionLink>
      </div>
    </div>
  );
}

function ChecklistItem({ item, tracking }: { item: string; tracking: PublicActionTrackingContext }) {
  const labelledLinkMatch = item.match(/^(.+?)\s*\|\s*(https?:\/\/\S+)$/);

  if (labelledLinkMatch) {
    const [, label, rawHref] = labelledLinkMatch;
    const href = rawHref.replace(/[.,;!?]+$/, "");

    return (
      <div className="space-y-2">
        <p className="font-medium text-ink">{label.trim()}</p>
        <TrackedPublicActionLink
          className="break-all font-medium text-accent"
          href={href}
          tracking={{ ...tracking, destinationType: "EXTERNAL_URL", actionKey: "open_link" }}
        >
          {href}
        </TrackedPublicActionLink>
      </div>
    );
  }

  const urlMatch = item.match(/https?:\/\/\S+/);

  if (!urlMatch) {
    return <>{item}</>;
  }

  const href = urlMatch[0].replace(/[.,;!?]+$/, "");
  const [before, ...afterParts] = item.split(href);
  const after = afterParts.join(href);

  return (
    <>
      {before}
      <TrackedPublicActionLink
        className="font-medium text-accent"
        href={href}
        tracking={{ ...tracking, destinationType: "EXTERNAL_URL", actionKey: "open_link" }}
      >
        {href}
      </TrackedPublicActionLink>
      {after}
    </>
  );
}

function contactHref(value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  if (trimmed.startsWith("tel:")) {
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      return trimmed.startsWith("tel:+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;
    }

    return "";
  }

  if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return trimmed.startsWith("+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;
  }

  return "";
}

function HelpProfileValue({
  label,
  value,
  tracking
}: {
  label: string;
  value: string;
  tracking: PublicActionTrackingContext;
}) {
  const href = /\b(?:contact|call|phone)\b/i.test(label) ? contactHref(value) : "";

  if (href) {
    return (
      <TrackedPublicActionLink
        className="inline-flex rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm font-semibold text-accent"
        href={href}
        tracking={{ ...tracking, destinationType: "PHONE", actionKey: "call" }}
      >
        Call contact
      </TrackedPublicActionLink>
    );
  }

  return <>{value}</>;
}

export default async function PublicStickerPage({
  params
}: {
  params: { publicCode: string };
}) {
  const resolution = await loadPublicRuntime(params.publicCode);

  if (resolution.kind === "NOT_FOUND") {
    notFound();
  }

  if (resolution.kind === "DISABLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-panel">
          <h1 className="text-2xl font-semibold">Sticker unavailable</h1>
          <p className="mt-2 text-sm text-muted">This TapCare sticker is currently disabled.</p>
        </div>
      </div>
    );
  }

  if (resolution.kind === "DIRECT_REDIRECT") {
    if (resolution.destinationUrl.startsWith("tel:")) {
      return (
        <TelRedirectPage
          href={resolution.destinationUrl}
          tracking={{
            siteId: resolution.household.siteId,
            householdId: resolution.household.id,
            stickerId: resolution.sticker.id,
            publicCode: resolution.publicCode,
            stickerType: resolution.sticker.stickerType,
            runtimeMode: resolution.sticker.runtimeMode,
            destinationType: "PHONE",
            actionKey: "call"
          }}
        />
      );
    }

    redirect(resolution.destinationUrl);
  }

  const { sticker, page } = resolution;
  const tracking = {
    siteId: resolution.household.siteId,
    householdId: resolution.household.id,
    stickerId: sticker.id,
    publicCode: resolution.publicCode,
    stickerType: sticker.stickerType,
    runtimeMode: sticker.runtimeMode,
    actionKey: "open_link"
  } satisfies PublicActionTrackingContext;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="text-3xl font-semibold">{page?.title ?? sticker.name}</h1>
        <p className="mt-2 text-sm text-muted">
          Public support page. Use only for the immediate care or safe-return situation.
        </p>
      </div>

      {page?.pageType === "CHECKLIST" ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel">
          <ul className="space-y-3">
            {page.content.checklistItems?.map((item) => (
              <li key={item} className="rounded-2xl border border-black/5 p-4">
                <ChecklistItem item={item} tracking={tracking} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {page?.pageType === "HELP_PROFILE" ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel">
          <dl className="space-y-4">
            {page.content.helpFields?.map((field) => (
              <div key={field.label}>
                <dt className="text-sm text-muted">{field.label}</dt>
                <dd className="font-medium">
                  <HelpProfileValue label={field.label} value={field.value} tracking={tracking} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {page?.pageType === "RESOURCES" ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel">
          <div className="space-y-3">
            {page.content.links?.map((link) => (
              <TrackedPublicActionLink
                key={link.href}
                className="block rounded-2xl border border-black/5 p-4 hover:bg-accentSoft"
                href={link.href}
                tracking={{ ...tracking, destinationType: "EXTERNAL_URL", actionKey: "open_link" }}
              >
                <span className="block font-medium">{link.label}</span>
                <span className="mt-1 block break-all text-sm text-accent">{link.href}</span>
              </TrackedPublicActionLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
