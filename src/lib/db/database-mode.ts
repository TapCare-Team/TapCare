export type DataMode = "database" | "mock";

const HOSTED_VERCEL_ENVIRONMENTS = new Set(["preview", "production"]);

export class DataModeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataModeConfigurationError";
  }
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDataMode(): DataMode {
  const configuredMode = process.env.TAPCARE_DATA_MODE?.trim();

  if (configuredMode && configuredMode !== "database" && configuredMode !== "mock") {
    throw new DataModeConfigurationError(
      `Invalid TAPCARE_DATA_MODE value "${configuredMode}". Expected "database" or "mock".`
    );
  }

  if (configuredMode === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new DataModeConfigurationError("TAPCARE_DATA_MODE=mock is not allowed when NODE_ENV=production.");
    }

    if (process.env.VERCEL_ENV && HOSTED_VERCEL_ENVIRONMENTS.has(process.env.VERCEL_ENV)) {
      throw new DataModeConfigurationError(
        `TAPCARE_DATA_MODE=mock is not allowed when VERCEL_ENV=${process.env.VERCEL_ENV}.`
      );
    }

    return "mock";
  }

  if (!hasDatabaseUrl()) {
    throw new DataModeConfigurationError(
      "DATABASE_URL is required. For local development or tests only, set TAPCARE_DATA_MODE=mock."
    );
  }

  return "database";
}

export function isDatabaseConfigured() {
  return getDataMode() === "database";
}
