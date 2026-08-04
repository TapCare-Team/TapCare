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

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as { error?: string; id?: string };
  }

  return null;
}

export function HouseholdCreateForm({
  siteOptions,
  canPersist
}: {
  siteOptions: SiteOption[];
  canPersist: boolean;
}) {
  const router = useRouter();
  const siteId = siteOptions[0]?.id ?? "";
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [seniorDisplayName, setSeniorDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fieldErrors = {
    addressLine1: validateHouseholdAddressLine1(addressLine1),
    addressLine2: validateOptionalAddressLine2(addressLine2),
    unitNumber: validateOptionalUnitNumber(unitNumber),
    postalCode: validateOptionalPostalCode(postalCode)
  };

  function visibleFieldError(field: keyof typeof fieldErrors, value: string) {
    if (!fieldErrors[field]) {
      return "";
    }

    return hasSubmitted || value.trim().length > 0 ? fieldErrors[field] : "";
  }

  function validateForm() {
    return (
      fieldErrors.addressLine1 ||
      fieldErrors.addressLine2 ||
      fieldErrors.unitNumber ||
      fieldErrors.postalCode
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
      const response = await fetch("/api/v1/admin/households/duplicate-check", {
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
        duplicate?: { id: string; displayAddress: string } | null;
        error?: string;
      };

      if (!response.ok) {
        setDuplicateWarning(null);
        return;
      }

      if (payload.duplicate) {
        setDuplicateWarning(
          `Possible duplicate: ${payload.duplicate.displayAddress} already exists.`
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
    setHasSubmitted(true);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/admin/households", {
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

      const payload = await readJsonResponse(response);

      if (!response.ok || !payload?.id) {
        if (response.status === 401) {
          setError("Your sign-in session expired. Please sign in again and create the household.");
          return;
        }

        setError(payload?.error ?? "Unable to create household. Please check the details and try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to create household. Please refresh the page and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!siteId ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Household creation needs one configured site record before records can be saved.
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
        {visibleFieldError("addressLine1", addressLine1) ? (
          <span className="text-sm text-red-600">{visibleFieldError("addressLine1", addressLine1)}</span>
        ) : null}
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
        {visibleFieldError("addressLine2", addressLine2) ? (
          <span className="text-sm text-red-600">{visibleFieldError("addressLine2", addressLine2)}</span>
        ) : null}
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
          {visibleFieldError("unitNumber", unitNumber) ? (
            <span className="text-sm text-red-600">{visibleFieldError("unitNumber", unitNumber)}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-muted">
          Postal code
          <input
            value={postalCode}
            onChange={(event) => {
              setPostalCode(event.target.value);
              setError(null);
            }}
            onBlur={checkDuplicate}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
            placeholder="460018"
            inputMode="numeric"
            maxLength={12}
            disabled={!canPersist || isSubmitting}
          />
          {visibleFieldError("postalCode", postalCode) ? (
            <span className="text-sm text-red-600">{visibleFieldError("postalCode", postalCode)}</span>
          ) : null}
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
          placeholder="Optional, for easier identification"
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
