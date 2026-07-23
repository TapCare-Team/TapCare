import {
  publicStickerOperationalGuidance,
  publicStickerPrivacyGuidance
} from "@/modules/privacy/sticker-content-policy";

type StickerPrivacyGuidanceProps = {
  compact?: boolean;
  includeOperations?: boolean;
};

export function StickerPrivacyGuidance({
  compact = false,
  includeOperations = false
}: StickerPrivacyGuidanceProps) {
  const items = includeOperations
    ? [...publicStickerPrivacyGuidance, ...publicStickerOperationalGuidance]
    : publicStickerPrivacyGuidance;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Public sticker privacy</p>
      <ul className={`mt-2 list-disc space-y-1 pl-5 ${compact ? "text-xs" : ""}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
