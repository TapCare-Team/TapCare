"use client";

import type { ReactNode } from "react";
import type { DestinationType, RuntimeMode, StickerType } from "@/modules/analytics/domain/analytics";

type ActionKey = "open_link" | "call" | "whatsapp";

export type PublicActionTrackingContext = {
  siteId: string;
  householdId: string;
  stickerId: string;
  publicCode: string;
  stickerType: StickerType;
  runtimeMode: RuntimeMode;
  destinationType?: DestinationType;
  actionKey: ActionKey;
};

export function TrackedPublicActionLink({
  href,
  className,
  children,
  tracking
}: {
  href: string;
  className?: string;
  children: ReactNode;
  tracking: PublicActionTrackingContext;
}) {
  function recordClick() {
    const payload = {
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      siteId: tracking.siteId,
      householdId: tracking.householdId,
      stickerId: tracking.stickerId,
      publicCode: tracking.publicCode,
      stickerType: tracking.stickerType,
      runtimeMode: tracking.runtimeMode,
      eventType: "PAGE_ACTION_CLICKED",
      outcome: "SUCCESS",
      destinationType: tracking.destinationType,
      metadata: {
        actionKey: tracking.actionKey
      }
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/v1/events/interactions", new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch("/api/v1/events/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      keepalive: true
    });
  }

  return (
    <a className={className} href={href} onClick={recordClick}>
      {children}
    </a>
  );
}
