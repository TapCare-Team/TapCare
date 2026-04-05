export const commonMessages = {
  unauthorized: "Unauthorized",
  forbidden: "Forbidden"
} as const;

export const setupMessages = {
  invalidCreatePayload: "Invalid sticker payload",
  invalidUpdatePayload: "Invalid sticker update payload",
  invalidAssignPayload: "Invalid assign payload",
  listFailed: "Unable to list stickers",
  createFailed: "Unable to create sticker",
  updateFailed: "Unable to update sticker",
  activateFailed: "Unable to activate sticker",
  disableFailed: "Unable to disable sticker",
  assignFailed: "Unable to assign sticker",
  databaseUnavailable: "DATABASE_URL is required for setup APIs",
  householdNotFound: "Household not found",
  stickerNotFound: "Sticker not found",
  displayCodeConflict: "Unable to create sticker after retrying display code generation",
  uniqueDisplayCodeFailed: "Unable to generate a unique sticker reference code"
} as const;

export const signalMessages = {
  invalidReviewPayload: "Invalid review payload",
  reviewFailed: "Unable to review follow-up signal",
  signalNotFound: "Signal not found"
} as const;

export const analyticsMessages = {
  invalidInteractionEventPayload: "Invalid interaction event payload"
} as const;
