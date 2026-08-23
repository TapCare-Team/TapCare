import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateUser: vi.fn(),
  createUserSession: vi.fn(),
  checkLoginIpLimit: vi.fn(),
  checkLoginAccountLimit: vi.fn(),
  setCookie: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  authenticateUser: mocks.authenticateUser,
  createUserSession: mocks.createUserSession
}));

vi.mock("@/lib/rate-limit/limiters", () => ({
  checkLoginIpLimit: mocks.checkLoginIpLimit,
  checkLoginAccountLimit: mocks.checkLoginAccountLimit
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mocks.setCookie
  })
}));

import { POST } from "@/app/api/auth/login/route";

function loginRequest(
  email = "dev.admin@tapcare.sg",
  password = "TapCare1234!"
) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-forwarded-for": "203.0.113.10"
    },
    body: new URLSearchParams({
      email,
      password
    })
  });
}

const adminUser = {
  id: "user-admin-1",
  displayName: "Admin",
  role: "ADMIN" as const,
  siteIds: [],
  householdIds: []
};

describe("POST /api/auth/login rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.checkLoginIpLimit.mockResolvedValue({
      allowed: true
    });

    mocks.checkLoginAccountLimit.mockResolvedValue({
      allowed: true
    });

    mocks.authenticateUser.mockResolvedValue(null);

    mocks.createUserSession.mockResolvedValue({
      sessionToken: "session-token"
    });
  });

  it("blocks before password verification when the IP limit is exceeded", async () => {
    mocks.checkLoginIpLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 120
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=rate_limited"
    );
    expect(response.headers.get("retry-after")).toBe("120");

    expect(mocks.authenticateUser).not.toHaveBeenCalled();
    expect(mocks.checkLoginAccountLimit).not.toHaveBeenCalled();
  });

  it("counts the account limiter only after an invalid password", async () => {
    mocks.authenticateUser.mockResolvedValueOnce(null);

    const response = await POST(
      loginRequest("user@example.com", "wrong-password")
    );

    expect(mocks.authenticateUser).toHaveBeenCalledWith(
      "user@example.com",
      "wrong-password"
    );

    expect(mocks.checkLoginAccountLimit).toHaveBeenCalledWith(
      "user@example.com"
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=invalid"
    );
  });

  it("shows rate limiting after too many failed attempts for one account", async () => {
    mocks.authenticateUser.mockResolvedValueOnce(null);

    mocks.checkLoginAccountLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 300
    });

    const response = await POST(
      loginRequest("user@example.com", "wrong-password")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=rate_limited"
    );
    expect(response.headers.get("retry-after")).toBe("300");
  });

  it("does not consult the account failure bucket after a valid password", async () => {
    mocks.authenticateUser.mockResolvedValueOnce(adminUser);

    const response = await POST(loginRequest());

    expect(mocks.checkLoginAccountLimit).not.toHaveBeenCalled();

    expect(mocks.createUserSession).toHaveBeenCalledWith(
      "user-admin-1"
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/admin"
    );
  });
});
