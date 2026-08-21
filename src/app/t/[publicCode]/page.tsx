import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { PublicStickerContent } from "@/components/runtime/public-sticker-content";
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
            publicCode: resolution.publicCode,
            actionKey: "call"
          }}
        />
      );
    }

    redirect(resolution.destinationUrl);
  }

  const { sticker, page } = resolution;
  const tracking = {
    publicCode: resolution.publicCode,
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

      {page ? <PublicStickerContent page={page} tracking={tracking} /> : null}
    </div>
  );
}
