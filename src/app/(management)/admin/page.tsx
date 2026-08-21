import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AdminPage() { await requireUserWithRole(["ADMIN"]); return <AppShell title="Admin dashboard" subtitle="Manage TapCare households, follow-up, and operational analytics." nav={[]}><div className="grid gap-6 md:grid-cols-3"><Panel title="Households" eyebrow="Operations"><Link href="/households" className="text-sm font-medium text-accent">Manage households</Link></Panel><Panel title="Follow-up" eyebrow="Signals"><Link href="/follow-up" className="text-sm font-medium text-accent">Review follow-ups</Link></Panel><Panel title="Analytics" eyebrow="Administration"><Link href="/admin/analytics" className="text-sm font-medium text-accent">Open analytics</Link></Panel></div></AppShell>; }
