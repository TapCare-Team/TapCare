import Link from "next/link";
import type { AwaitedHouseholdListItem } from "@/types/view-models";

export function CaseloadTable({ households }: { households: AwaitedHouseholdListItem[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white">
      <table className="min-w-full divide-y divide-black/5 text-left">
        <thead className="bg-stone-50 text-sm text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Household</th>
            <th className="px-4 py-3 font-medium">Last active</th>
            <th className="px-4 py-3 font-medium">Signals</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {households.map((household) => (
            <tr key={household.id}>
              <td className="px-4 py-4">
                <p className="font-medium">{household.displayAddress}</p>
                <p className="text-sm text-muted">{household.seniorAliases.join(", ")}</p>
              </td>
              <td className="px-4 py-4 text-sm text-muted">
                {household.lastActiveAt ? new Date(household.lastActiveAt).toLocaleDateString() : "No activity yet"}
              </td>
              <td className="px-4 py-4 text-sm">{household.signal?.signalType.replaceAll("_", " ") ?? "None"}</td>
              <td className="px-4 py-4 text-right">
                <Link href={`/caregiver/households/${household.id}/stickers`} className="font-medium">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
