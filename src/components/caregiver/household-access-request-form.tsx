"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestHouseholdAccessSchema } from "@/modules/households/contracts/household-access-request.contract";
import type { HouseholdAccessRequest } from "@/modules/households/domain/household-access-request";

type SiteOption = {
  id: string;
  name: string;
  code: string;
};

type RequestErrors = Partial<Record<
  "siteId" | "addressLine1" | "addressLine2" | "unitNumber" | "postalCode" | "seniorDisplayName" | "requesterNote",
  string[]
>>;

function firstError(errors: RequestErrors, field: keyof RequestErrors) {
  return errors[field]?.[0] ?? "";
}

function statusLabel(status: HouseholdAccessRequest["status"]) {
  if (status === "APPROVED") {
    return "Approved";
  }

  if (status === "REJECTED") {
    return "Not approved";
  }

  return "Pending review";
}

export function HouseholdAccessRequestForm({
  sites,
  initialRequests,
  canRequest
}: {
  sites: SiteOption[];
  initialRequests: HouseholdAccessRequest[];
  canRequest: boolean;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [seniorDisplayName, setSeniorDisplayName] = useState("");
  const [requesterNote, setRequesterNote] = useState("");
  const [errors, setErrors] = useState<RequestErrors>({});
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setStatus("");

    const parsed = requestHouseholdAccessSchema.safeParse({
      siteId,
      addressLine1,
      addressLine2,
      unitNumber,
      postalCode,
      seniorDisplayName,
      requesterNote
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/caregiver/household-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request.");
      }

      setAddressLine1("");
      setAddressLine2("");
      setUnitNumber("");
      setPostalCode("");
      setSeniorDisplayName("");
      setRequesterNote("");
      setStatus("Request submitted. Admin will review and assign the household if approved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 bg-white p-5">
        {!canRequest ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Household requests need the database to be connected.
          </div>
        ) : null}

        <label className="flex flex-col gap-2 text-sm text-muted">
          Satellite office
          <select
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            disabled={!canRequest}
            className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
          {firstError(errors, "siteId") ? <span className="text-sm text-red-600">{firstError(errors, "siteId")}</span> : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-muted">
          Address line 1
          <input
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
            disabled={!canRequest}
            className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
            placeholder="Blk 123 Bedok North Street 2"
          />
          {firstError(errors, "addressLine1") ? (
            <span className="text-sm text-red-600">{firstError(errors, "addressLine1")}</span>
          ) : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Unit number
            <input
              value={unitNumber}
              onChange={(event) => setUnitNumber(event.target.value)}
              disabled={!canRequest}
              className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
              placeholder="#05-123"
            />
            {firstError(errors, "unitNumber") ? (
              <span className="text-sm text-red-600">{firstError(errors, "unitNumber")}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            Postal code
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              disabled={!canRequest}
              inputMode="numeric"
              className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
              placeholder="460123"
            />
            {firstError(errors, "postalCode") ? (
              <span className="text-sm text-red-600">{firstError(errors, "postalCode")}</span>
            ) : null}
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-muted">
          Senior name or alias
          <input
            value={seniorDisplayName}
            onChange={(event) => setSeniorDisplayName(event.target.value)}
            disabled={!canRequest}
            className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
            placeholder="Mdm Lim"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-muted">
          Note for admin
          <textarea
            value={requesterNote}
            onChange={(event) => setRequesterNote(event.target.value)}
            disabled={!canRequest}
            rows={3}
            className="rounded-xl border border-black/10 bg-panel px-4 py-3 text-ink outline-none transition focus:border-ink"
            placeholder="Optional context for matching the household"
          />
          {firstError(errors, "requesterNote") ? (
            <span className="text-sm text-red-600">{firstError(errors, "requesterNote")}</span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={!canRequest || isSubmitting}
          className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Request household access"}
        </button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        {initialRequests.length === 0 ? (
          <p className="p-5 text-sm text-muted">No household requests yet.</p>
        ) : (
          initialRequests.map((request) => (
            <div key={request.id} className="border-b border-black/5 p-5 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.displayAddress}</p>
                  <p className="text-sm text-muted">{request.siteName}</p>
                </div>
                <span className="rounded-full bg-accentSoft px-3 py-1 text-sm text-accent">
                  {statusLabel(request.status)}
                </span>
              </div>
              {request.requesterNote ? <p className="mt-3 text-sm text-muted">{request.requesterNote}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
