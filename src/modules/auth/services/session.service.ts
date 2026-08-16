import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDataMode } from "@/lib/db/database-mode";
import { logger } from "@/lib/logging/logger";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signupSchema,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignupInput
} from "@/modules/auth/contracts/login.contract";
import type { SessionUser, UserRole } from "@/modules/auth/domain/access";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/modules/auth/domain/session";
import { MockAuthRepository } from "@/modules/auth/repositories/mock-auth.repository";
import { PrismaAuthRepository } from "@/modules/auth/repositories/prisma-auth.repository";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password.service";
import {
  generatePasswordResetToken,
  hashPasswordResetToken
} from "@/modules/auth/services/password-reset-token.service";
import { generateSessionToken } from "@/modules/auth/services/session-token.service";
import { DomainError } from "@/modules/shared/errors";
import { authMessages } from "@/modules/shared/messages";

const mockAuthRepository = new MockAuthRepository();
const prismaAuthRepository = new PrismaAuthRepository();
const PASSWORD_RESET_MAX_AGE_MINUTES = 30;

function getAuthRepository() {
  return getDataMode() === "database" ? prismaAuthRepository : mockAuthRepository;
}

export function defaultRouteForUser(user: Pick<SessionUser, "role">) {
  if (user.role === "CAREGIVER") {
    return "/caregiver";
  }

  return "/";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const repository = getAuthRepository();

  try {
    return await repository.getSessionUserBySessionToken(sessionToken);
  } catch (error) {
    logger.warn("auth_lookup_failed", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireUserWithRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(`/wrong-account?needed=${roles.join(",")}`);
  }

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const repository = getAuthRepository();
  return repository.authenticateByEmailPassword(email, password);
}

export async function createUserSession(userId: string) {
  const repository = getAuthRepository();
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await repository.createSession(userId, sessionToken, expiresAt);

  return { sessionToken, expiresAt };
}

export async function revokeUserSession(sessionToken: string) {
  const repository = getAuthRepository();
  await repository.revokeSession(sessionToken);
}

export async function signupCaregiver(rawInput: SignupInput) {
  const input = signupSchema.parse(rawInput);
  const repository = getAuthRepository();
  const passwordHash = await hashPassword(input.password);

  return repository.createCaregiverUser({
    displayName: input.displayName,
    email: input.email,
    passwordHash
  });
}

export async function signInWithVerifiedOAuthProfile(input: {
  provider: "google";
  providerUserId: string;
  email: string;
  displayName: string;
}) {
  const repository = getAuthRepository();
  return repository.findOrCreateOAuthCaregiverUser({
    provider: input.provider,
    providerUserId: input.providerUserId,
    email: input.email,
    displayName: input.displayName
  });
}

export async function requestPasswordReset(rawInput: ForgotPasswordInput) {
  const input = forgotPasswordSchema.parse(rawInput);
  const repository = getAuthRepository();
  const user = await repository.findActiveUserByEmail(input.email);

  if (!user) {
    return { token: null };
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MAX_AGE_MINUTES * 60 * 1000);

  await repository.createPasswordResetToken(user.id, tokenHash, expiresAt);

  logger.info("password_reset_requested", {
    userId: user.id,
    expiresAt: expiresAt.toISOString()
  });

  return { token };
}

export async function resetPassword(rawInput: ResetPasswordInput) {
  const input = resetPasswordSchema.parse(rawInput);
  const repository = getAuthRepository();
  const passwordHash = await hashPassword(input.password);
  const user = await repository.consumePasswordResetToken(hashPasswordResetToken(input.token), passwordHash);

  if (!user) {
    throw new DomainError(authMessages.invalidResetToken, 400, "INVALID_PASSWORD_RESET_TOKEN");
  }

  logger.info("password_reset_completed", { userId: user.id });
  return user;
}

export async function changePasswordForUser(user: SessionUser, rawInput: ChangePasswordInput) {
  const input = changePasswordSchema.parse(rawInput);
  const repository = getAuthRepository();
  const currentPasswordHash = await repository.getPasswordHashByUserId(user.id);

  if (currentPasswordHash && (!input.currentPassword || !(await verifyPassword(input.currentPassword, currentPasswordHash)))) {
    throw new DomainError(authMessages.invalidCurrentPassword, 400, "INVALID_CURRENT_PASSWORD");
  }

  const passwordHash = await hashPassword(input.password);
  await repository.updateUserPassword(user.id, passwordHash);
  await repository.revokeAllSessionsForUser(user.id);
  logger.info("password_changed", { userId: user.id });
}

export async function userHasPassword(user: SessionUser) {
  const repository = getAuthRepository();
  return Boolean(await repository.getPasswordHashByUserId(user.id));
}
