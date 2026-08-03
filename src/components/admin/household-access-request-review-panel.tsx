"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HouseholdAccessRequest } from "@/modules/households/domain/household-access-request";

export function HouseholdAccessRequestReviewPanel({
  initialRequests
}: {
  initialRequests: HouseholdAccessRequest[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [activeRequestId, setActiveRequestId] = useState("");
  const [message, setMessage] = useState("");

  async function reviewRequest(requestId: string, action: "approve" | "reject") {
    setActiveRequestId(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/v1/admin/household-requests/${requestId}/${action}`, {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? `Unable to ${action} request.`);
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      setMessage(action === "approve" ? "Request approved and caregiver assigned." : "Request rejected.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to ${action} request.`);
    } finally {
      setActiveRequestId("");
    }
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted">No pending household requests.</p>;
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      {requests.map((request) => (
        <div key={request.id} className="rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{request.displayAddress}</p>
              <p className="text-sm text-muted">
                {request.requesterName} | {request.requesterEmail}
              </p>
              {request.seniorDisplayName ? (
                <p className="mt-2 text-sm text-muted">Senior: {request.seniorDisplayName}</p>
              ) : null}
              {request.requesterNote ? <p className="mt-2 text-sm text-muted">{request.requesterNote}</p> : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={activeRequestId === request.id}
                onClick={() => reviewRequest(request.id, "approve")}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={activeRequestId === request.id}
                onClick={() => reviewRequest(request.id, "reject")}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-panel disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
