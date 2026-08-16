const hostedVercelEnvironments = new Set(["preview", "production"]);
const vercelEnvironment = process.env.VERCEL_ENV?.trim();

if (!vercelEnvironment || !hostedVercelEnvironments.has(vercelEnvironment)) {
  process.exit(0);
}

const dataMode = process.env.TAPCARE_DATA_MODE?.trim();

if (dataMode && dataMode !== "database" && dataMode !== "mock") {
  throw new Error(`Invalid TAPCARE_DATA_MODE value "${dataMode}". Expected "database" or "mock".`);
}

if (dataMode === "mock") {
  throw new Error(`TAPCARE_DATA_MODE=mock is not allowed when VERCEL_ENV=${vercelEnvironment}.`);
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(`DATABASE_URL is required when VERCEL_ENV=${vercelEnvironment}.`);
}
