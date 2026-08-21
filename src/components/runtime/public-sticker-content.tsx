"use client";

import React, { type ReactNode } from "react";
import type { PageConfig } from "@/modules/stickers/domain/sticker";
import {
  type PublicActionTrackingContext,
  TrackedPublicActionLink
} from "@/components/runtime/tracked-public-action-link";

type PublicStickerContentProps = { page: PageConfig; tracking?: PublicActionTrackingContext };

function PublicActionLink({ href, className, children, tracking, actionKey }: { href: string; className?: string; children: ReactNode; tracking?: PublicActionTrackingContext; actionKey: PublicActionTrackingContext["actionKey"] }) {
  return tracking ? <TrackedPublicActionLink href={href} className={className} tracking={{ ...tracking, actionKey }}>{children}</TrackedPublicActionLink> : <a href={href} className={className}>{children}</a>;
}

function contactHref(value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("tel:")) return digitsOnly.length >= 8 && digitsOnly.length <= 15 ? (trimmed.startsWith("tel:+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`) : "";
  return digitsOnly.length >= 8 && digitsOnly.length <= 15 ? (trimmed.startsWith("+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`) : "";
}

function ChecklistItem({ item, tracking }: { item: string; tracking?: PublicActionTrackingContext }) {
  const labelled = item.match(/^(.+?)\s*\|\s*(https:\/\/\S+)$/);
  if (labelled) {
    const [, label, rawHref] = labelled;
    const href = rawHref.replace(/[.,;!?]+$/, "");
    return <div className="space-y-2"><p className="font-medium text-ink">{label.trim()}</p><PublicActionLink className="break-all font-medium text-accent" href={href} tracking={tracking} actionKey="open_link">{href}</PublicActionLink></div>;
  }
  const url = item.match(/https:\/\/\S+/)?.[0]?.replace(/[.,;!?]+$/, "");
  if (!url) return <>{item}</>;
  const [before, ...after] = item.split(url);
  return <>{before}<PublicActionLink className="font-medium text-accent" href={url} tracking={tracking} actionKey="open_link">{url}</PublicActionLink>{after.join(url)}</>;
}

export function PublicStickerContent({ page, tracking }: PublicStickerContentProps) {
  if (page.pageType === "CHECKLIST") return <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel"><ul className="space-y-3">{page.content.checklistItems.map((item) => <li key={item} className="rounded-2xl border border-black/5 p-4"><ChecklistItem item={item} tracking={tracking} /></li>)}</ul></div>;
  if (page.pageType === "HELP_PROFILE") return <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel"><dl className="space-y-4">{page.content.helpFields.map((field) => { const href = /\b(?:contact|call|phone)\b/i.test(field.label) ? contactHref(field.value) : ""; return <div key={field.label}><dt className="text-sm text-muted">{field.label}</dt><dd className="font-medium">{href ? <PublicActionLink className="inline-flex rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm font-semibold text-accent" href={href} tracking={tracking} actionKey="call">Call contact</PublicActionLink> : field.value}</dd></div>; })}</dl></div>;
  return <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel"><div className="space-y-3">{page.content.links.map((link) => <PublicActionLink key={link.href} className="block rounded-2xl border border-black/5 p-4 hover:bg-accentSoft" href={link.href} tracking={tracking} actionKey="open_link"><span className="block font-medium">{link.label}</span><span className="mt-1 block break-all text-sm text-accent">{link.href}</span></PublicActionLink>)}</div></div>;
}
