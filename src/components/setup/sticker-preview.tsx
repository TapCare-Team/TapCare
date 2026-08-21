import type { Sticker } from "@/modules/stickers/domain/sticker";
import { PublicStickerContent } from "@/components/runtime/public-sticker-content";

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

  return sticker.page ? (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="text-3xl font-semibold">{sticker.page.title}</h1>
        <p className="mt-2 text-sm text-muted">Public support page. Use only for the immediate care or safe-return situation.</p>
      </div>
      <PublicStickerContent page={sticker.page} />
    </div>
  ) : null;
}
