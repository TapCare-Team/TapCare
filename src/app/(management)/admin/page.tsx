import { AdminHouseholdDashboard } from "@/components/admin/admin-household-dashboard";
import { requireUserWithRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AdminPage({ searchParams }: { searchParams?: { reason?: string | string[] } }) { const user = await requireUserWithRole(["ADMIN"]); return <AdminHouseholdDashboard user={user} searchParams={searchParams} />; }
