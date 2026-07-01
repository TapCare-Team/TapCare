import { OfficerAssignmentForm } from "@/components/admin/officer-assignment-form";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { listOfficerAccessForAdmin } from "@/modules/admin/services/officer-assignment.service";

export const dynamic = "force-dynamic";

export default async function AdminOfficersPage() {
  const user = await requireUserWithRole(["ADMIN", "DEVELOPER"]);
  const { officers, sites } = await listOfficerAccessForAdmin(user);

  return (
    <AppShell
      title="Officer Access"
      subtitle="Grant SGO partner staff access to officer household and sticker tools."
      nav={[
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/", label: "Officer tools" }
      ]}
    >
      <Panel title="Assign officer" eyebrow="Admin only">
        <OfficerAssignmentForm sites={sites} initialOfficers={officers} />
      </Panel>
    </AppShell>
  );
}
