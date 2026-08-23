export const RATE_LIMITS = {
  loginIp: { limit: 10, window: "10 m" },
  loginAccount: { limit: 5, window: "10 m" },
  signupIp: { limit: 5, window: "1 h" },
  passwordResetIp: { limit: 5, window: "1 h" },
  passwordResetAccount: { limit: 3, window: "1 h" },
  stickerAnalytics: { limit: 60, window: "1 m" },
  stickerOpenDedupSeconds: 5
} as const;
