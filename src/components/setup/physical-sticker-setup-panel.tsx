"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Sticker } from "@/modules/stickers/domain/sticker";

export function PhysicalStickerSetupPanel({ sticker, nfcUrl, onChanged }: { sticker: Sticker; nfcUrl: string; onChanged: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const tested = Boolean(sticker.physicalTagTestedAt);
  async function change(method: "POST" | "DELETE") {
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/setup/stickers/${sticker.id}/physical-setup`, { method });
      if (!response.ok) {
        throw new Error("Unable to update physical sticker setup.");
      }
      onChanged();
    } finally { setBusy(false); }
  }
  return (
    <section className="space-y-3 rounded-2xl border border-accent/20 bg-accentSoft p-4">
      <div>
        <p className="font-semibold">Physical tag</p>
        <p className="text-sm text-muted">
          {tested ? `Tested ${new Date(sticker.physicalTagTestedAt!).toLocaleDateString()}` : "Not tested"}
        </p>
      </div>
      <label className="text-xs text-muted">
        NFC URL
        <input readOnly value={nfcUrl} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-2 text-ink" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(nfcUrl); setCopied(true); }} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm">
          {copied ? "Copied" : "Copy NFC URL"}
        </button>
        <QRCodeSVG value={nfcUrl} size={96} aria-label="QR code for NFC URL" />
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Copy the TapCare NFC URL.</li><li>Open an NFC writing app and create a URL record.</li>
        <li>Paste the URL and write it to the physical sticker.</li><li>Tap the sticker to make sure it works.</li>
        <li>Return here and mark it tested.</li>
      </ol>
      {tested ? (
        <button type="button" disabled={busy} onClick={() => change("DELETE")} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm">
          {busy ? "Resetting..." : "Replace / reprogram tag"}
        </button>
      ) : (
        <>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I wrote the TapCare URL to the physical NFC sticker and tapped it successfully.</label>
          <button type="button" disabled={!confirmed || busy} onClick={() => change("POST")} className="rounded-full bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Saving..." : "Mark physical sticker tested"}
          </button>
        </>
      )}
    </section>
  );
}
