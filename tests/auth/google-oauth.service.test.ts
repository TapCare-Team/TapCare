import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCodeForProfile,
  googleRedirectUri,
  isGoogleOAuthConfigured
} from "@/modules/auth/services/google-oauth.service";

describe("google-oauth.service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("detects whether Google OAuth is configured", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");

    expect(isGoogleOAuthConfigured()).toBe(true);
  });

  it("builds authorization urls with state and nonce", () => {
    vi.stubEnv("APP_BASE_URL", "https://tapcare.example");
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");

    const url = buildGoogleAuthorizationUrl({
      requestUrl: "http://localhost:3000/login",
      state: "state-value",
      nonce: "nonce-value"
    });

    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://tapcare.example/api/auth/google/callback");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("nonce")).toBe("nonce-value");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
  });

  it("uses request origin for redirect uri when app base url is not configured", () => {
    expect(googleRedirectUri("http://localhost:3000/login")).toBe(
      "http://localhost:3000/api/auth/google/callback"
    );
  });

  it("returns a verified Google provider identity", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");
    vi.stubEnv("APP_BASE_URL", "https://tapcare.example");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token" }),
        status: 200
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "google-user-123",
          aud: "google-client-id",
          email: "maya@example.org",
          email_verified: "true",
          name: "Maya Lim",
          nonce: "nonce-value"
        }),
        status: 200
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeGoogleCodeForProfile({
        requestUrl: "https://tapcare.example/login",
        code: "code-value",
        expectedNonce: "nonce-value"
      })
    ).resolves.toEqual({
      provider: "google",
      providerUserId: "google-user-123",
      email: "maya@example.org",
      displayName: "Maya Lim"
    });
  });

  it("rejects Google profiles without a stable account identifier", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token" }),
        status: 200
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aud: "google-client-id",
          email: "maya@example.org",
          email_verified: true,
          nonce: "nonce-value"
        }),
        status: 200
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeGoogleCodeForProfile({
        requestUrl: "http://localhost:3000/login",
        code: "code-value",
        expectedNonce: "nonce-value"
      })
    ).rejects.toThrow("Google account identifier is missing");
  });
});
