import type { Sticker } from "@/modules/stickers/domain/sticker";

export function StickerPreview({ sticker }: { sticker: Sticker }) {
  if (sticker.runtimeMode === "DIRECT_REDIRECT" && sticker.destination) {
    return (
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6">
        <p className="text-sm text-muted">This physical sticker opens this action immediately:</p>
        <a href={sticker.destination.value} className="inline-flex rounded-full bg-accent px-5 py-3 font-semibold text-white">
          {sticker.destination.label ?? "Open contact action"}
        </a>
      </section>
    );
  }

  if (!sticker.page) return null;
  return (
    <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6">
      <h2 className="text-2xl font-semibold">{sticker.page.title}</h2>
      {sticker.page.pageType === "CHECKLIST" ? <ul className="space-y-2">{sticker.page.content.checklistItems.map((item) => <li key={item}>• {item}</li>)}</ul> : null}
      {sticker.page.pageType === "HELP_PROFILE" ? <dl className="space-y-2">{sticker.page.content.helpFields.map((field) => <div key={field.label}><dt className="text-sm text-muted">{field.label}</dt><dd>{field.value}</dd></div>)}</dl> : null}
      {sticker.page.pageType === "RESOURCES" ? <ul className="space-y-3">{sticker.page.content.links.map((link) => <li key={link.href}><a href={link.href} className="text-accent underline">{link.label}</a></li>)}</ul> : null}
    </section>
  );
}
