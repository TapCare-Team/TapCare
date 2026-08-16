import { afterEach, describe, expect, it, vi } from "vitest";
import { getDataMode, isDatabaseConfigured } from "@/lib/db/database-mode";

function configureEnvironment(input: {
  databaseUrl?: string;
  dataMode?: string;
  nodeEnv?: string;
  vercelEnv?: string;
}) {
  vi.stubEnv("DATABASE_URL", input.databaseUrl ?? "");
  vi.stubEnv("TAPCARE_DATA_MODE", input.dataMode ?? "");
  vi.stubEnv("NODE_ENV", input.nodeEnv ?? "development");
  vi.stubEnv("VERCEL_ENV", input.vercelEnv ?? "");
}

describe("database mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to database mode when DATABASE_URL is present", () => {
    configureEnvironment({ databaseUrl: "postgresql://localhost/tapcare" });

    expect(getDataMode()).toBe("database");
    expect(isDatabaseConfigured()).toBe(true);
  });

  it("rejects missing DATABASE_URL in the default mode", () => {
    configureEnvironment({});

    expect(() => getDataMode()).toThrow(/DATABASE_URL is required/);
  });

  it("allows explicit mock mode during local development", () => {
    configureEnvironment({ dataMode: "mock", nodeEnv: "development" });

    expect(getDataMode()).toBe("mock");
    expect(isDatabaseConfigured()).toBe(false);
  });

  it("rejects mock mode in production", () => {
    configureEnvironment({ dataMode: "mock", nodeEnv: "production" });

    expect(() => getDataMode()).toThrow(/not allowed when NODE_ENV=production/);
  });

  it.each(["preview", "production"])("rejects mock mode in Vercel %s", (vercelEnv) => {
    configureEnvironment({ dataMode: "mock", nodeEnv: "development", vercelEnv });

    expect(() => getDataMode()).toThrow(new RegExp(`not allowed when VERCEL_ENV=${vercelEnv}`));
  });

  it("rejects unknown data modes", () => {
    configureEnvironment({ databaseUrl: "postgresql://localhost/tapcare", dataMode: "random" });

    expect(() => getDataMode()).toThrow(/Invalid TAPCARE_DATA_MODE/);
  });

  it("treats a whitespace-only DATABASE_URL as missing", () => {
    configureEnvironment({ databaseUrl: "   " });

    expect(() => getDataMode()).toThrow(/DATABASE_URL is required/);
  });

  it("keeps write guards disabled when explicit mock mode also has DATABASE_URL", () => {
    configureEnvironment({
      databaseUrl: "postgresql://localhost/tapcare",
      dataMode: "mock",
      nodeEnv: "development"
    });

    expect(getDataMode()).toBe("mock");
    expect(isDatabaseConfigured()).toBe(false);
  });
});
