"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Household } from "@/modules/households/domain/household";

type CaregiverAssignmentPanelProps = {
  householdId: string;
  assignments: Household["caregiverAssignments"];
};

export function CaregiverAssignmentPanel({
  householdId,
  assignments
}: CaregiverAssignmentPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [removeCandidate, setRemoveCandidate] = useState<Household["caregiverAssignments"][number] | null>(null);

  async function assignCaregiver() {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/admin/households/${householdId}/caregivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        alreadyAssigned?: boolean;
        caregiver?: { displayName?: string; email?: string };
      } | null;

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your sign-in session expired. Please sign in again and retry.");
          return;
        }

        setError(payload?.error ?? "Unable to assign caregiver. Please check the email and try again.");
        return;
      }

      const caregiverLabel = payload?.caregiver?.displayName || payload?.caregiver?.email || "Caregiver";
      setSuccess(
        payload?.alreadyAssigned
          ? `${caregiverLabel} is already assigned to this household.`
          : `${caregiverLabel} can now see this household in the caregiver page.`
      );
      setEmail("");
      router.refresh();
    } catch {
      setError("Unable to assign caregiver. Please refresh the page and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeCaregiver() {
    if (!removeCandidate) return;
    setError(""); setSuccess(""); setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/households/${householdId}/caregivers/${removeCandidate.caregiverId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) { setError(payload?.error ?? "Unable to remove caregiver access."); return; }
      setSuccess(`${removeCandidate.displayName} no longer has access to this household.`);
      setRemoveCandidate(null); router.refresh();
    } catch { setError("Unable to remove caregiver access. Please try again."); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted">No caregivers are assigned to this household yet.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.caregiverId} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-medium">{assignment.displayName}</p><button type="button" onClick={() => setRemoveCandidate(assignment)} className="text-sm font-medium text-red-700">Remove access</button></div>
              <p className="text-sm text-muted">{assignment.email}</p>
            </div>
          ))
        )}
      </div>

      {removeCandidate ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="font-medium">Remove {removeCandidate.displayName} from this household?</p><p className="mt-1 text-sm text-muted">They will immediately lose access to this household and its sticker configuration.</p><div className="mt-3 flex gap-3"><button type="button" onClick={() => setRemoveCandidate(null)} disabled={isSubmitting}>Cancel</button><button type="button" onClick={removeCaregiver} disabled={isSubmitting} className="rounded-full bg-red-700 px-4 py-2 text-sm text-white">{isSubmitting ? "Removing..." : "Remove access"}</button></div></div> : null}

      <div className="grid gap-3 rounded-2xl border border-black/5 bg-panel p-4 md:grid-cols-[1fr_auto]">
        <label className="space-y-2 text-sm text-muted">
          Caregiver email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="caregiver@example.com"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink"
          />
        </label>
        <button
          type="button"
          onClick={assignCaregiver}
          disabled={isSubmitting || email.trim().length === 0}
          className="self-end rounded-full border border-accent/20 bg-accentSoft px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Assigning..." : "Assign caregiver"}
        </button>
      </div>

      <p className="text-sm text-muted">
        The caregiver must already have a TapCare caregiver account. If the email is not found, ask them to sign up
        first.
      </p>
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
    </div>
  );
}
