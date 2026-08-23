import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "@/middleware";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";

function makeRequest(pathname: string, authenticated = false) {
  const headers = new Headers();

  if (authenticated) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=test-session`);
  }

  return new NextRequest(`https://tapcare.test${pathname}`, {
    headers
  });
}

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("public homepage route migration", () => {
  it("keeps the public homepage accessible without a session", () => {
    const response = middleware(makeRequest("/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated admin visitors to login", () => {
    const response = middleware(makeRequest("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://tapcare.test/login"
    );
  });

  it("allows an authenticated request through to the admin surface", () => {
    const response = middleware(makeRequest("/admin", true));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("routes admins to /admin after authentication", () => {
    expect(defaultRouteForUser({ role: "ADMIN" })).toBe("/admin");
  });

  it("routes caregivers to /caregiver after authentication", () => {
    expect(defaultRouteForUser({ role: "CAREGIVER" })).toBe("/caregiver");
  });
});

describe("admin navigation after moving the dashboard to /admin", () => {
  it("links the analytics overview back to /admin", () => {
    const source = readSource(
      "src/app/(admin)/admin/analytics/page.tsx"
    );

    expect(source).toContain(
      '{ href: "/admin", label: "Manage households" }'
    );

    expect(source).not.toContain(
      '{ href: "/", label: "Manage households" }'
    );
  });

  it("links interaction details back to /admin", () => {
    const source = readSource(
      "src/app/(admin)/admin/analytics/interactions/page.tsx"
    );

    expect(source).toContain(
      '{ href: "/admin", label: "Manage households" }'
    );

    expect(source).not.toContain(
      '{ href: "/", label: "Manage households" }'
    );
  });
});