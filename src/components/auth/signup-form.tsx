"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signupSchema } from "@/modules/auth/contracts/login.contract";

type SignupFieldErrors = Partial<Record<"displayName" | "email" | "password" | "confirmPassword", string[]>>;

function firstError(errors: SignupFieldErrors, field: keyof SignupFieldErrors) {
  return errors[field]?.[0] ?? "";
}

function passwordChecks(password: string) {
  return [
    { label: "12 characters", met: password.length >= 12 },
    { label: "uppercase letter", met: /[A-Z]/.test(password) },
    { label: "lowercase letter", met: /[a-z]/.test(password) },
    { label: "number", met: /\d/.test(password) },
    { label: "symbol", met: /[^A-Za-z0-9]/.test(password) }
  ];
}

function PasswordInput({
  name,
  label,
  value,
  error,
  onChange,
  placeholder
}: {
  name: "password" | "confirmPassword";
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {label}
      <div className="flex overflow-hidden rounded-xl border border-black/10 bg-panel transition focus-within:border-ink">
        <input
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={12}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-panel px-4 py-4 text-ink outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="px-4 text-sm font-medium text-muted transition hover:text-ink"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const parsed = signupSchema.safeParse({
      displayName,
      email,
      password,
      confirmPassword
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("displayName", parsed.data.displayName);
      formData.set("email", parsed.data.email);
      formData.set("password", parsed.data.password);
      formData.set("confirmPassword", parsed.data.confirmPassword);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          fieldErrors?: SignupFieldErrors;
        } | null;
        setFormError(payload?.error ?? "Unable to create account.");
        setFieldErrors(payload?.fieldErrors ?? {});
        return;
      }

      router.replace("/caregiver");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <label className="flex flex-col gap-2 text-sm text-muted">
        Name
        <input
          name="displayName"
          autoComplete="name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="rounded-xl border border-black/10 bg-panel px-4 py-4 text-ink outline-none transition focus:border-ink"
          placeholder="Your name"
        />
        {firstError(fieldErrors, "displayName") ? (
          <span className="text-sm text-red-600">{firstError(fieldErrors, "displayName")}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm text-muted">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-black/10 bg-panel px-4 py-4 text-ink outline-none transition focus:border-ink"
          placeholder="Enter email"
        />
        {firstError(fieldErrors, "email") ? (
          <span className="text-sm text-red-600">{firstError(fieldErrors, "email")}</span>
        ) : null}
      </label>

      <PasswordInput
        name="password"
        label="Password"
        value={password}
        onChange={setPassword}
        error={firstError(fieldErrors, "password")}
        placeholder="Enter password"
      />

      <PasswordInput
        name="confirmPassword"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={firstError(fieldErrors, "confirmPassword")}
        placeholder="Confirm password"
      />

      <div className="rounded-xl border border-black/5 bg-panel px-4 py-3 text-xs text-muted">
        <p className="font-medium text-ink">Password must include:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {passwordChecks(password).map((check) => (
            <span
              key={check.label}
              className={`rounded-full px-3 py-1 ${check.met ? "bg-accentSoft text-accent" : "bg-white text-muted"}`}
            >
              {check.label}
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-ink px-5 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
