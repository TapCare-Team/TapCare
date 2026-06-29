"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldErrors = Partial<Record<"currentPassword" | "password" | "confirmPassword", string[]>>;

function firstError(errors: FieldErrors, key: keyof FieldErrors) {
  return errors[key]?.[0] ?? "";
}

function PasswordInput({
  label,
  autoComplete,
  value,
  onChange,
  error
}: {
  label: string;
  autoComplete: string;
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
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
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

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function changePassword() {
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, confirmPassword })
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: FieldErrors;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to change password.");
        setFieldErrors(payload?.fieldErrors ?? {});
        return;
      }

      router.push("/login?changed=1");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {hasPassword ? (
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={firstError(fieldErrors, "currentPassword")}
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This account uses Google sign-in and does not have a TapCare password yet. Set one here if you also want to
          sign in with email and password.
        </div>
      )}
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={firstError(fieldErrors, "password")}
      />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={firstError(fieldErrors, "confirmPassword")}
      />

      <button
        type="button"
        onClick={changePassword}
        disabled={isSubmitting}
        className="rounded-full border border-accent/20 bg-accentSoft px-5 py-3 text-sm font-semibold text-accent transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : hasPassword ? "Change password" : "Set password"}
      </button>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
