import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/modules/auth/domain/access";
import type { SignupInput } from "@/modules/auth/contracts/login.contract";
import { verifyPassword } from "@/modules/auth/services/password.service";
import { hashSessionToken } from "@/modules/auth/services/session-token.service";

const sessionUserInclude = {
  householdAssignments: true
} as const;

function toSessionUser(user: {
  id: string;
  displayName: string;
  globalRole: SessionUser["role"];
  householdAssignments: Array<{ householdId: string; endedAt: Date | null }>;
}): SessionUser {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.globalRole,
    siteIds: [],
    householdIds: user.householdAssignments
      .filter((assignment) => assignment.endedAt === null)
      .map((assignment) => assignment.householdId)
  };
}

export class PrismaAuthRepository {
  async getSessionUserBySessionToken(sessionToken: string): Promise<SessionUser | null> {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      include: {
        user: {
          include: sessionUserInclude
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() || session.user.status !== "ACTIVE") {
      return null;
    }

    return toSessionUser(session.user);
  }

  async authenticateByEmailPassword(email: string, password: string): Promise<SessionUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive"
        },
        status: "ACTIVE"
      },
      include: sessionUserInclude
    });

    if (!user?.passwordHash) {
      return null;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    return passwordMatches ? toSessionUser(user) : null;
  }

  async createSession(userId: string, sessionToken: string, expiresAt: Date) {
    await prisma.authSession.create({
      data: {
        userId,
        tokenHash: hashSessionToken(sessionToken),
        expiresAt
      }
    });
  }

  async revokeSession(sessionToken: string) {
    await prisma.authSession.updateMany({
      where: {
        tokenHash: hashSessionToken(sessionToken),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  async createCaregiverUser(input: Pick<SignupInput, "displayName" | "email"> & { passwordHash: string }) {
    const user = await prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        passwordHash: input.passwordHash,
        globalRole: "CAREGIVER",
        status: "ACTIVE"
      },
      include: sessionUserInclude
    });

    return toSessionUser(user);
  }

  async findOrCreateOAuthCaregiverUser(input: {
    provider: "google";
    providerUserId: string;
    displayName: string;
    email: string;
  }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const provider = input.provider.toUpperCase() as "GOOGLE";
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: input.providerUserId
        }
      },
      include: {
        user: {
          include: sessionUserInclude
        }
      }
    });

    if (existingIdentity?.user.status === "ACTIVE") {
      return toSessionUser(existingIdentity.user);
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive"
        },
        status: "ACTIVE"
      },
      include: sessionUserInclude
    });

    if (existing) {
      await prisma.authIdentity.create({
        data: {
          userId: existing.id,
          provider,
          providerUserId: input.providerUserId,
          email: normalizedEmail
        }
      });
      return toSessionUser(existing);
    }

    const created = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: normalizedEmail,
          displayName: input.displayName.trim() || normalizedEmail,
          globalRole: "CAREGIVER",
          status: "ACTIVE"
        },
        include: sessionUserInclude
      });

      await transaction.authIdentity.create({
        data: {
          userId: user.id,
          provider,
          providerUserId: input.providerUserId,
          email: normalizedEmail
        }
      });

      return user;
    });

    return toSessionUser(created);
  }

  async findActiveUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive"
        },
        status: "ACTIVE"
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });
  }

  async getPasswordHashByUserId(userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        status: "ACTIVE"
      },
      select: {
        passwordHash: true
      }
    });

    return user?.passwordHash ?? null;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    const now = new Date();
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      }),
      prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt
        }
      })
    ]);
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }

  async revokeAllSessionsForUser(userId: string) {
    await prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  async consumePasswordResetToken(tokenHash: string, passwordHash: string) {
    const now = new Date();
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: sessionUserInclude
        }
      }
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= now.getTime() ||
      resetToken.user.status !== "ACTIVE"
    ) {
      return null;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now }
      }),
      prisma.authSession.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null
        },
        data: { revokedAt: now }
      })
    ]);

    return toSessionUser(resetToken.user);
  }
}
