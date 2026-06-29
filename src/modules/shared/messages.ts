export const commonMessages = {
  unauthorized: "Unauthorized",
  forbidden: "Forbidden"
} as const;

export const authMessages = {
  passwordResetRequested: "If an account exists for that email, a reset link has been prepared.",
  invalidResetToken: "Reset link is invalid or expired.",
  invalidCurrentPassword: "Current password is incorrect.",
  passwordChanged: "Password changed. Please sign in again."
} as const;

export const setupMessages = {
  invalidCreatePayload: "Invalid sticker payload",
  invalidUpdatePayload: "Invalid sticker update payload",
  invalidAssignPayload: "Invalid assign payload",
  listFailed: "Unable to list stickers",
  createFailed: "Unable to create sticker",
  updateFailed: "Unable to update sticker",
  deleteFailed: "Unable to delete sticker",
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
  databaseUnavailable: "DATABASE_URL is required for signal reviews",
  invalidReviewPayload: "Invalid review payload",
  reviewFailed: "Unable to review follow-up signal",
  signalNotFound: "Signal not found"
} as const;

export const analyticsMessages = {
  invalidInteractionEventPayload: "Invalid interaction event payload"
} as const;

export const householdMessages = {
  databaseUnavailable: "DATABASE_URL is required for household setup",
  invalidCreatePayload: "Invalid household payload",
  createFailed: "Unable to create household",
  deleteFailed: "Unable to delete household",
  assignCaregiverFailed: "Unable to assign caregiver",
  duplicateCheckFailed: "Unable to check for duplicate households",
  duplicateAddress: "A household with the same address already exists in this satellite office",
  householdNotFound: "Household not found",
  caregiverNotFound: "Caregiver needs to sign up first.",
  caregiverAlreadyAssigned: "This caregiver is already assigned to the household.",
  outOfScopeSite: "Officers can only add households within their assigned satellite scope"
} as const;
