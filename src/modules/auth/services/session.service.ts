import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { logger } from "@/lib/logging/logger";
import type { SessionUser, UserRole } from "@/modules/auth/domain/access";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";
import { MockAuthRepository } from "@/modules/auth/repositories/mock-auth.repository";
import { PrismaAuthRepository } from "@/modules/auth/repositories/prisma-auth.repository";

const mockAuthRepository = new MockAuthRepository();
const prismaAuthRepository = new PrismaAuthRepository();

async function getAuthRepository() {
  return isDatabaseConfigured() ? prismaAuthRepository : mockAuthRepository;
}

export function defaultRouteForUser(user: Pick<SessionUser, "role">) {
  if (user.role === "CAREGIVER") {
    return "/caregiver";
  }

  if (user.role === "ADMIN" || user.role === "DEVELOPER") {
    return "/admin/analytics";
  }

  return "/";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  try {
    const repository = await getAuthRepository();
    return await repository.getSessionUserById(userId);
  } catch (error) {
    logger.warn("auth_lookup_failed", {
      userId,
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
    redirect(defaultRouteForUser(user));
  }

  return user;
}

export async function listLoginUsers() {
  const repository = await getAuthRepository();
  return repository.listLoginUsers();
}
