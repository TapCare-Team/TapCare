"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteHouseholdButton({
  householdId,
  householdLabel
}: {
  householdId: string;
  householdLabel: string;
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteHousehold() {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/admin/households/${householdId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (response.status === 401) {
          setError("Your sign-in session expired. Please sign in again and retry.");
          return;
        }

        setError(payload?.error ?? "Unable to delete household. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to delete household. Please refresh the page and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isConfirming) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p>
          Delete {householdLabel}? This archives the household and disables its stickers. Historical usage data is kept.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-muted transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteHousehold}
            disabled={isDeleting}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50"
    >
      Delete household
    </button>
  );
}
