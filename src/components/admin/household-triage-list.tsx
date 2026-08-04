import Link from "next/link";
import { SignalBadge } from "@/components/shared/signal-badge";
import type { AwaitedHouseholdListItem } from "@/types/view-models";

function formatLastActive(lastActiveAt?: string) {
  if (!lastActiveAt) {
    return "No activity yet";
  }

  return new Date(lastActiveAt).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function activeStickerCount(household: AwaitedHouseholdListItem) {
  return household.stickers.filter((sticker) => sticker.status === "ACTIVE").length;
}

function AssignedCaregivers({ household }: { household: AwaitedHouseholdListItem }) {
  if (household.caregiverAssignments.length === 0) {
    return <span className="text-sm text-muted">No caregiver assigned</span>;
  }

  return (
    <div className="space-y-2">
      {household.caregiverAssignments.map((assignment) => (
        <div key={assignment.caregiverId}>
          <p className="text-sm font-medium text-ink">{assignment.displayName}</p>
          <p className="break-all text-sm text-muted">{assignment.email}</p>
        </div>
      ))}
    </div>
  );
}

export function HouseholdTriageList({ households }: { households: AwaitedHouseholdListItem[] }) {
  if (households.length === 0) {
    return <p className="text-sm text-muted">No households matched the selected follow-up reason.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <table className="min-w-full table-fixed divide-y divide-black/5 text-left">
        <thead className="bg-stone-50 text-sm text-muted">
          <tr>
            <th className="w-[31%] px-4 py-3 font-medium">Household</th>
            <th className="w-[22%] px-4 py-3 font-medium">Assigned caregiver</th>
            <th className="w-[18%] px-4 py-3 font-medium">Follow-up reason</th>
            <th className="w-[13%] px-4 py-3 font-medium">Current setup</th>
            <th className="w-[10%] px-4 py-3 font-medium">Last active</th>
            <th className="w-[6%] px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {households.map((household) => (
            <tr key={household.id}>
              <td className="px-4 py-4 align-top">
                <p className="font-medium">{household.displayAddress}</p>
                <p className="text-sm text-muted">{household.seniorAliases.join(", ") || "No senior aliases"}</p>
              </td>
              <td className="px-4 py-4 align-top">
                <AssignedCaregivers household={household} />
              </td>
              <td className="px-4 py-4 align-top">
                {household.signal ? <SignalBadge signalType={household.signal.signalType} /> : (
                  <span className="text-sm text-muted">None</span>
                )}
              </td>
              <td className="px-4 py-4 align-top text-sm text-muted">
                {activeStickerCount(household)} active / {household.stickers.length} total stickers
              </td>
              <td className="px-4 py-4 align-top text-sm text-muted">{formatLastActive(household.lastActiveAt)}</td>
              <td className="px-4 py-4 text-right align-top">
                <Link href={`/households/${household.id}`} className="whitespace-nowrap font-medium">
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
