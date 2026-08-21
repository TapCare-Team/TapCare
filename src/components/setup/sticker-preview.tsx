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

  return sticker.page ? <PublicStickerContent page={sticker.page} /> : null;
}
