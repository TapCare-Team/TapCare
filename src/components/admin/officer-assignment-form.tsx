"use client";

import { useMemo, useState } from "react";

type SiteOption = {
  id: string;
  name: string;
  code: string;
};

type OfficerAccessUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  sites: Array<{
    id: string;
    name: string;
    code: string;
    role: string;
  }>;
};

function validateEmail(email: string) {
  if (!email.trim()) {
    return "Enter the staff member's account email.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid staff email address.";
  }

  return "";
}

export function OfficerAssignmentForm({
  sites,
  initialOfficers
}: {
  sites: SiteOption[];
  initialOfficers: OfficerAccessUser[];
}) {
  const [email, setEmail] = useState("");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [officers, setOfficers] = useState(initialOfficers);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailError = useMemo(() => validateEmail(email), [email]);
  const siteError = siteId ? "" : "Choose a satellite office for this officer.";
  const canSubmit = !emailError && !siteError && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!canSubmit) {
      setStatus(emailError || siteError || "Please check the officer details and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, siteId })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to assign officer.");
      }

      setOfficers((current) => {
        const next = current.filter((officer) => officer.id !== payload.officer.id);
        return [...next, payload.officer].sort((left, right) =>
          left.displayName.localeCompare(right.displayName)
        );
      });
      setEmail("");
      setStatus(`${payload.officer.displayName} can now access the officer tools.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to assign officer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5">
        <div>
          <label htmlFor="officer-email" className="text-sm font-medium">
            Staff email
          </label>
          <input
            id="officer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="amina.tan@partner.org"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-accent"
          />
          {email && emailError ? <p className="mt-2 text-sm text-red-600">{emailError}</p> : null}
          {!email ? (
            <p className="mt-2 text-sm text-muted">
              The staff member must sign up first using this exact email.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="officer-site" className="text-sm font-medium">
            Satellite office
          </label>
          <select
            id="officer-site"
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-accent"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
          {siteError ? <p className="mt-2 text-sm text-red-600">{siteError}</p> : null}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Assigning..." : "Assign officer"}
        </button>

        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] border-b border-black/5 px-5 py-3 text-sm font-medium text-muted">
          <span>Account</span>
          <span>Access</span>
        </div>
        {officers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No officer accounts yet.</p>
        ) : (
          officers.map((officer) => (
            <div
              key={officer.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 border-b border-black/5 px-5 py-4 last:border-b-0"
            >
              <div>
                <p className="font-semibold">{officer.displayName}</p>
                <p className="break-all text-sm text-muted">{officer.email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{officer.role}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {officer.role === "ADMIN" || officer.role === "DEVELOPER" ? (
                  <span className="rounded-full bg-accentSoft px-3 py-1 text-sm text-accent">All sites</span>
                ) : officer.sites.length > 0 ? (
                  officer.sites.map((site) => (
                    <span key={`${officer.id}-${site.id}-${site.role}`} className="rounded-full bg-accentSoft px-3 py-1 text-sm text-accent">
                      {site.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted">No site access</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
