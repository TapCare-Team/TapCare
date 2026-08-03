import Link from "next/link";
import { SignalBadge } from "@/components/shared/signal-badge";
import type { AwaitedHouseholdListItem } from "@/types/view-models";

function activeStickerCount(household: AwaitedHouseholdListItem) {
  return household.stickers.filter((sticker) => sticker.status === "ACTIVE").length;
}

export function CaseloadTable({ households }: { households: AwaitedHouseholdListItem[] }) {
  if (households.length === 0) {
    return <p className="text-sm text-muted">No households are assigned to this caregiver yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <table className="min-w-full table-fixed divide-y divide-black/5 text-left">
        <thead className="bg-stone-50 text-sm text-muted">
          <tr>
            <th className="w-[43%] px-4 py-3 font-medium">Household</th>
            <th className="w-[21%] px-4 py-3 font-medium">Follow-up reason</th>
            <th className="w-[16%] px-4 py-3 font-medium">Current setup</th>
            <th className="w-[12%] px-4 py-3 font-medium">Last active</th>
            <th className="w-[8%] px-4 py-3 font-medium"></th>
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
                {household.signal ? <SignalBadge signalType={household.signal.signalType} /> : (
                  <span className="text-sm text-muted">None</span>
                )}
              </td>
              <td className="px-4 py-4 align-top text-sm text-muted">
                {activeStickerCount(household)} active / {household.stickers.length} total stickers
              </td>
              <td className="px-4 py-4 align-top text-sm text-muted">
                {household.lastActiveAt ? new Date(household.lastActiveAt).toLocaleDateString() : "No activity yet"}
              </td>
              <td className="px-4 py-4 text-right align-top">
                <Link href={`/caregiver/households/${household.id}`} className="whitespace-nowrap font-medium">
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
