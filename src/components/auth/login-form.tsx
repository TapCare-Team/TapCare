"use client";

import Link from "next/link";
import { useState } from "react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isValidEmail(email)) {
      event.preventDefault();
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
  }

  return (
    <form action="/api/auth/login" method="post" onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="flex flex-col gap-2 text-sm text-muted">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            const nextEmail = event.target.value;
            setEmail(nextEmail);
            setEmailError(nextEmail && !isValidEmail(nextEmail) ? "Enter a valid email address." : "");
          }}
          className="rounded-xl border border-black/10 bg-panel px-4 py-4 text-ink outline-none transition focus:border-ink"
          placeholder="Enter email"
        />
        {emailError ? <span className="text-sm text-red-600">{emailError}</span> : null}
      </label>

      <label className="flex flex-col gap-2 text-sm text-muted">
        Password
        <div className="flex overflow-hidden rounded-xl border border-black/10 bg-panel transition focus-within:border-ink">
          <input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 bg-panel px-4 py-4 text-ink outline-none"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="px-4 text-sm font-medium text-muted transition hover:text-ink"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <button
        type="submit"
        className="w-full rounded-xl bg-ink px-5 py-4 text-sm font-semibold text-white transition hover:bg-black"
      >
        Sign in
      </button>

      <div className="text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-ink">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
