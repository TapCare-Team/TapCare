"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  validateHouseholdAddressLine1,
  validateOptionalAddressLine2,
  validateOptionalPostalCode,
  validateOptionalUnitNumber
} from "@/modules/households/domain/household-input-validation";

type SiteOption = {
  id: string;
  code: string;
  name: string;
  region?: string;
};

export function HouseholdCreateForm({
  siteOptions,
  canPersist
}: {
  siteOptions: SiteOption[];
  canPersist: boolean;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(siteOptions[0]?.id ?? "");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [seniorDisplayName, setSeniorDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  function validateForm() {
    return (
      validateHouseholdAddressLine1(addressLine1) ||
      validateOptionalAddressLine2(addressLine2) ||
      validateOptionalUnitNumber(unitNumber) ||
      validateOptionalPostalCode(postalCode)
    );
  }

  async function checkDuplicate() {
    if (!canPersist || !siteId || !addressLine1.trim()) {
      setDuplicateWarning(null);
      return;
    }

    if (validateForm()) {
      setDuplicateWarning(null);
      return;
    }

    setIsCheckingDuplicate(true);

    try {
      const response = await fetch("/api/v1/officer/households/duplicate-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          siteId,
          addressLine1,
          addressLine2,
          unitNumber,
          postalCode
        })
      });

      const payload = (await response.json()) as {
        duplicate?: { id: string; displayAddress: string; siteName: string } | null;
        error?: string;
      };

      if (!response.ok) {
        setDuplicateWarning(null);
        return;
      }

      if (payload.duplicate) {
        setDuplicateWarning(
          `Possible duplicate: ${payload.duplicate.displayAddress} already exists under ${payload.duplicate.siteName}.`
        );
        return;
      }

      setDuplicateWarning(null);
    } catch {
      setDuplicateWarning(null);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }

  useEffect(() => {
    if (!addressLine1.trim()) {
      setDuplicateWarning(null);
      return;
    }

    void checkDuplicate();
  }, [siteId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPersist) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/officer/households", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          siteId,
          addressLine1,
          addressLine2,
          unitNumber,
          postalCode,
          seniorDisplayName
        })
      });

      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        setError(payload.error ?? "Unable to create household");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create household");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {siteOptions.length > 1 ? (
        <label className="flex flex-col gap-2 text-sm text-muted">
          Satellite office
          <select
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
            disabled={!canPersist || isSubmitting}
          >
            {siteOptions.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
                {site.region ? ` (${site.region})` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : siteOptions[0] ? (
        <div className="rounded-2xl border border-black/5 bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Satellite office</p>
          <p className="mt-2 font-medium">
            {siteOptions[0].name}
            {siteOptions[0].region ? ` (${siteOptions[0].region})` : ""}
          </p>
        </div>
      ) : null}

      <label className="flex flex-col gap-2 text-sm text-muted">
        Block and street address
        <input
          value={addressLine1}
          onChange={(event) => {
            setAddressLine1(event.target.value);
            setError(null);
          }}
          onBlur={checkDuplicate}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          placeholder="e.g. Blk 18 Bedok South Road"
          disabled={!canPersist || isSubmitting}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-muted">
        Additional address details
        <input
          value={addressLine2}
          onChange={(event) => {
            setAddressLine2(event.target.value);
            setError(null);
          }}
          onBlur={checkDuplicate}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          placeholder="e.g. Opposite market or lift lobby"
          disabled={!canPersist || isSubmitting}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Unit number
          <input
            value={unitNumber}
            onChange={(event) => {
              setUnitNumber(event.target.value);
              setError(null);
            }}
            onBlur={checkDuplicate}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
            placeholder="#05-123"
            disabled={!canPersist || isSubmitting}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-muted">
          Postal code
          <input
            value={postalCode}
            onChange={(event) => {
              setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            onBlur={checkDuplicate}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
            placeholder="460018"
            inputMode="numeric"
            maxLength={6}
            disabled={!canPersist || isSubmitting}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-muted">
        Senior display name
        <input
          value={seniorDisplayName}
          onChange={(event) => {
            setSeniorDisplayName(event.target.value);
            setError(null);
          }}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          placeholder="Optional, for easier officer identification"
          disabled={!canPersist || isSubmitting}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canPersist || isSubmitting || !siteId}
          className="rounded-full border border-accent/20 bg-accentSoft px-5 py-2.5 text-sm font-medium text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating household..." : "Create household"}
        </button>
      </div>

      <div className="space-y-2" aria-live="polite">
        {isCheckingDuplicate ? <p className="text-sm text-muted">Checking for existing household records...</p> : null}
        {duplicateWarning ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {duplicateWarning}
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}
