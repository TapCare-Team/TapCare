import { logger } from "@/lib/logging/logger";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenInfo = {
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  nonce?: string;
  error?: string;
  error_description?: string;
};

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(requestUrl: string) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  const baseUrl = configuredBaseUrl || new URL(requestUrl).origin;
  return new URL("/api/auth/google/callback", baseUrl).toString();
}

export function buildGoogleAuthorizationUrl(params: {
  requestUrl: string;
  state: string;
  nonce: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is required for Google sign-in");
  }

  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri(params.requestUrl));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeGoogleCodeForProfile(params: {
  requestUrl: string;
  code: string;
  expectedNonce: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleRedirectUri(params.requestUrl),
      grant_type: "authorization_code"
    })
  });
  const tokenPayload = (await tokenResponse.json().catch(() => null)) as GoogleTokenResponse | null;

  if (!tokenResponse.ok || !tokenPayload?.id_token) {
    logger.warn("google_oauth_token_exchange_failed", {
      status: tokenResponse.status,
      error: tokenPayload?.error ?? "unknown"
    });
    throw new Error("Unable to verify Google sign-in");
  }

  const tokenInfoResponse = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(tokenPayload.id_token)}`
  );
  const tokenInfo = (await tokenInfoResponse.json().catch(() => null)) as GoogleTokenInfo | null;

  if (!tokenInfoResponse.ok || !tokenInfo) {
    logger.warn("google_oauth_tokeninfo_failed", {
      status: tokenInfoResponse.status,
      error: tokenInfo?.error ?? "unknown"
    });
    throw new Error("Unable to verify Google sign-in");
  }

  if (tokenInfo.aud !== clientId) {
    throw new Error("Google sign-in audience mismatch");
  }

  if (tokenInfo.nonce && tokenInfo.nonce !== params.expectedNonce) {
    throw new Error("Google sign-in nonce mismatch");
  }

  if (!tokenInfo.sub) {
    throw new Error("Google account identifier is missing");
  }

  if (!tokenInfo.email || tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    provider: "google" as const,
    providerUserId: tokenInfo.sub,
    email: tokenInfo.email,
    displayName: tokenInfo.name || tokenInfo.email
  };
}
