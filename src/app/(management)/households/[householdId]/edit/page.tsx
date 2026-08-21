import { notFound } from "next/navigation";
import { HouseholdEditForm } from "@/components/households/household-edit-form";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";
export default async function EditHouseholdPage({ params }: { params: { householdId: string } }) { const user = await requireUserWithRole(["ADMIN"]); const detail = await getHouseholdDetail(user, params.householdId); if (!detail) notFound(); return <AppShell title="Edit household" subtitle="Correct address details without changing the household site or physical sticker URLs." nav={[{ href: `/households/${params.householdId}`, label: "Household details", replace: true }]}><Panel title="Address details" eyebrow="Admin"><HouseholdEditForm household={detail.household} /></Panel></AppShell>; }
