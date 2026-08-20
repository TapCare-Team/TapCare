"use client";

import type { ReactNode } from "react";

export type PublicActionKey = "open_link" | "call" | "whatsapp";

export type PublicActionTrackingContext = {
  publicCode: string;
  actionKey: PublicActionKey;
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
      publicCode: tracking.publicCode,
      actionKey: tracking.actionKey
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
