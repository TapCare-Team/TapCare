"use client";

import Link from "next/link";
import { useState } from "react";

type FieldErrors = Partial<Record<"token" | "password" | "confirmPassword", string[]>>;

function firstError(errors: FieldErrors, key: keyof FieldErrors) {
  return errors[key]?.[0] ?? "";
}

function PasswordInput({
  name,
  label,
  value,
  onChange,
  error
}: {
  name: "password" | "confirmPassword";
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {label}
      <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-white">
        <input
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-white px-4 py-3 text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="border-l border-black/10 px-4 text-sm font-medium text-accent transition hover:bg-accentSoft"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <span className="text-red-700">{error}</span> : null}
    </label>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function resetPassword() {
    setError("");
    setMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        fieldErrors?: FieldErrors;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to reset password.");
        setFieldErrors(payload?.fieldErrors ?? {});
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(payload?.message ?? "Password reset. You can now sign in with your new password.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <PasswordInput
        name="password"
        label="New password"
        value={password}
        onChange={setPassword}
        error={firstError(fieldErrors, "password")}
      />
      <PasswordInput
        name="confirmPassword"
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={firstError(fieldErrors, "confirmPassword")}
      />

      <button
        type="button"
        onClick={resetPassword}
        disabled={isSubmitting || !token}
        className="w-full rounded-full border border-accent/20 bg-accentSoft px-5 py-3 text-sm font-semibold text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <p>{message}</p>
          <Link href="/login" className="mt-2 inline-block font-medium text-accent">
            Sign in
          </Link>
        </div>
      ) : null}
    </div>
  );
}
