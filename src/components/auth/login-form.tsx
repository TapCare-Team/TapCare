"use client";

import Link from "next/link";
import { useState } from "react";

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
      <label className="flex flex-col gap-2 text-sm text-muted">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-muted">
        Password
        <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-white">
          <input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 bg-white px-4 py-3 text-ink outline-none"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="border-l border-black/10 px-4 text-sm font-medium text-accent transition hover:bg-accentSoft"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-accent">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full rounded-full border border-accent/20 bg-accentSoft px-5 py-3 text-sm font-semibold text-accent transition hover:bg-white"
      >
        Sign in
      </button>
    </form>
  );
}
