export const commonMessages = {
  unauthorized: "Please sign in to continue.",
  forbidden: "You do not have permission to do this."
} as const;

export const authMessages = {
  passwordResetRequested: "If an account exists for that email, a reset link has been prepared.",
  invalidResetToken: "Reset link is invalid or expired.",
  invalidCurrentPassword: "Current password is incorrect.",
  passwordChanged: "Password changed. Please sign in again."
} as const;

export const setupMessages = {
  invalidCreatePayload: "Please check the sticker details and try again.",
  invalidUpdatePayload: "Please check the sticker details and try again.",
  invalidAssignPayload: "Please choose a valid household for this sticker.",
  listFailed: "Unable to load stickers. Please refresh the page.",
  createFailed: "Unable to create sticker. Please check the details and try again.",
  updateFailed: "Unable to save sticker changes. Please check the details and try again.",
  deleteFailed: "Unable to delete sticker. Please try again.",
  activateFailed: "Unable to activate sticker. Please try again.",
  disableFailed: "Unable to disable sticker. Please try again.",
  assignFailed: "Unable to move this sticker to the selected household.",
  databaseUnavailable: "The database is not connected yet. Please contact TapCare support.",
  householdNotFound: "Household could not be found.",
  stickerNotFound: "Sticker could not be found.",
  displayCodeConflict: "We could not create a unique sticker code. Please try again.",
  uniqueDisplayCodeFailed: "We could not create a unique sticker code. Please try again."
} as const;

export const signalMessages = {
  databaseUnavailable: "The database is not connected yet. Please contact TapCare support.",
  invalidReviewPayload: "Please choose a valid follow-up action.",
  reviewFailed: "Unable to save this follow-up review. Please try again.",
  signalNotFound: "Follow-up item could not be found."
} as const;

export const analyticsMessages = {
  invalidInteractionEventPayload: "Please check the interaction event details and try again."
} as const;

export const householdMessages = {
  databaseUnavailable: "The database is not connected yet. Please contact TapCare support.",
  invalidCreatePayload: "Please check the household details and try again.",
  createFailed: "Unable to create household. Please check the details and try again.",
  deleteFailed: "Unable to delete household. Please try again.",
  assignCaregiverFailed: "Unable to assign caregiver. Please check the email and try again.",
  duplicateCheckFailed: "Unable to check for duplicate households right now. Please try again.",
  duplicateAddress: "A household with the same address already exists.",
  householdNotFound: "Household could not be found.",
  caregiverNotFound: "Caregiver needs to sign up first.",
  caregiverAlreadyAssigned: "This caregiver is already assigned to the household.",
  outOfScopeSite: "Household requests are not configured yet."
} as const;
