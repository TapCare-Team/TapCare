import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import {
  acknowledgeRenderedRuntimePage,
  loadPublicRuntime
} from "@/modules/runtime/controllers/public-runtime.controller";

export const dynamic = "force-dynamic";

function TelRedirectPage({ href }: { href: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <Script id="tapcare-tel-redirect" strategy="afterInteractive">
        {`window.location.replace(${JSON.stringify(href)});`}
      </Script>
      <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-panel">
        <p className="font-medium">Opening contact action...</p>
        <a className="mt-3 inline-block text-sm font-medium text-accent" href={href}>
          Continue if nothing happens
        </a>
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
      return <TelRedirectPage href={resolution.destinationUrl} />;
    }

    redirect(resolution.destinationUrl);
  }

  const { sticker, household, page } = resolution;
  await acknowledgeRenderedRuntimePage(resolution);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="text-3xl font-semibold">{page?.title ?? sticker.name}</h1>
        <p className="mt-2 text-sm text-muted">{household.displayAddress}</p>
      </div>

      {page?.pageType === "CHECKLIST" ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel">
          <ul className="space-y-3">
            {page.content.checklistItems?.map((item) => (
              <li key={item} className="rounded-2xl border border-black/5 p-4">
                {item}
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
                <dd className="font-medium">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {page?.pageType === "RESOURCES" ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel">
          <div className="space-y-3">
            {page.content.links?.map((link) => (
              <a
                key={link.href}
                className="block rounded-2xl border border-black/5 p-4 hover:bg-accentSoft"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
