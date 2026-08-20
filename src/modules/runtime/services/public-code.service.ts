export function normalizePublicCode(publicCode: string) {
  return publicCode.trim().toLowerCase();
}

export function isValidPublicCode(publicCode: string) {
  return /^[a-z0-9][a-z0-9-]{5,79}$/.test(publicCode);
}
