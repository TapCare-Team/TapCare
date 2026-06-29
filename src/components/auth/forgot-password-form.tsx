"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function submitResetRequest() {
    setError("");
    setMessage("");
    setResetUrl("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to request password reset.");
        return;
      }

      setMessage(payload?.message ?? "If an account exists for that email, a reset link has been prepared.");
      setResetUrl(payload?.resetUrl ?? "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <label className="flex flex-col gap-2 text-sm text-muted">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          placeholder="you@example.com"
        />
      </label>

      <button
        type="button"
        onClick={submitResetRequest}
        disabled={isSubmitting || email.trim().length === 0}
        className="w-full rounded-full border border-accent/20 bg-accentSoft px-5 py-3 text-sm font-semibold text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Preparing reset..." : "Request reset link"}
      </button>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {resetUrl ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Local development reset link</p>
          <Link href={resetUrl} className="mt-2 block break-all text-accent">
            {resetUrl}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
