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
        setError(payload?.error ?? "Unable to assign caregiver");
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to assign caregiver");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted">No caregivers are assigned to this household yet.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.caregiverId} className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="font-medium">{assignment.displayName}</p>
              <p className="text-sm text-muted">{assignment.email}</p>
            </div>
          ))
        )}
      </div>

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
