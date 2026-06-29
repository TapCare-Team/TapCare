import { randomUUID } from "node:crypto";
import { mockUsers } from "@/lib/mock-data";
import type { SessionUser } from "@/modules/auth/domain/access";
import type { SignupInput } from "@/modules/auth/contracts/login.contract";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password.service";

const mockCredentials: Record<string, { userId: string; password?: string; passwordHash?: string }> = {
  "amina.tan@tapcare.sg": { userId: "user-officer-1", password: "TapCare1234!" },
  "maya.lim@example.org": { userId: "user-caregiver-1", password: "TapCare1234!" },
  "dev.admin@tapcare.sg": { userId: "user-admin-1", password: "TapCare1234!" }
};

const mockSessions = new Map<string, { userId: string; expiresAt: Date; revokedAt?: Date }>();
const mockCreatedUsers = new Map<string, SessionUser>();
const mockResetTokens = new Map<string, { userId: string; expiresAt: Date; usedAt?: Date }>();
const mockOAuthIdentities = new Map<string, string>();

function getMockUserById(userId: string) {
  return Object.values(mockUsers).find((user) => user.id === userId) ?? mockCreatedUsers.get(userId) ?? null;
}

export class MockAuthRepository {
  async getSessionUserBySessionToken(sessionToken: string): Promise<SessionUser | null> {
    const session = mockSessions.get(sessionToken);

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return getMockUserById(session.userId);
  }

  async authenticateByEmailPassword(email: string, password: string): Promise<SessionUser | null> {
    const credential = mockCredentials[email.trim().toLowerCase()];

    if (!credential) {
      return null;
    }

    if (credential.password && credential.password !== password) {
      return null;
    }

    if (credential.passwordHash && !(await verifyPassword(password, credential.passwordHash))) {
      return null;
    }

    return getMockUserById(credential.userId);
  }

  async createSession(userId: string, sessionToken: string, expiresAt: Date) {
    mockSessions.set(sessionToken, { userId, expiresAt });
  }

  async revokeSession(sessionToken: string) {
    const session = mockSessions.get(sessionToken);
    if (session) {
      session.revokedAt = new Date();
    }
  }

  async createCaregiverUser(input: Pick<SignupInput, "displayName" | "email"> & { passwordHash: string }) {
    const email = input.email.trim().toLowerCase();
    if (mockCredentials[email]) {
      throw Object.assign(new Error("Email already exists"), {
        code: "P2002",
        meta: { target: ["email"] }
      });
    }

    const user: SessionUser = {
      id: `mock-user-${randomUUID()}`,
      displayName: input.displayName.trim(),
      role: "CAREGIVER",
      siteIds: [],
      householdIds: []
    };

    mockCreatedUsers.set(user.id, user);
    mockCredentials[email] = { userId: user.id, passwordHash: input.passwordHash };

    return user;
  }

  async findOrCreateOAuthCaregiverUser(input: {
    provider: "google";
    providerUserId: string;
    displayName: string;
    email: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const identityKey = `${input.provider}:${input.providerUserId}`;
    const existingIdentityUserId = mockOAuthIdentities.get(identityKey);

    if (existingIdentityUserId) {
      const user = getMockUserById(existingIdentityUserId);
      if (user) {
        return user;
      }
    }

    const credential = mockCredentials[email];

    if (credential) {
      const user = getMockUserById(credential.userId);
      if (user) {
        mockOAuthIdentities.set(identityKey, user.id);
        return user;
      }
    }

    const user: SessionUser = {
      id: `mock-user-${randomUUID()}`,
      displayName: input.displayName.trim() || email,
      role: "CAREGIVER",
      siteIds: [],
      householdIds: []
    };

    mockCreatedUsers.set(user.id, user);
    mockCredentials[email] = { userId: user.id };
    mockOAuthIdentities.set(identityKey, user.id);

    return user;
  }

  async findActiveUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = mockCredentials[normalizedEmail];

    if (!credential) {
      return null;
    }

    const user = getMockUserById(credential.userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: normalizedEmail,
      displayName: user.displayName
    };
  }

  async getPasswordHashByUserId(userId: string) {
    const credential = Object.values(mockCredentials).find((candidate) => candidate.userId === userId);
    if (credential?.passwordHash) {
      return credential.passwordHash;
    }

    return credential?.password ? hashPassword(credential.password) : null;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    mockResetTokens.forEach((resetToken) => {
      if (resetToken.userId === userId && !resetToken.usedAt) {
        resetToken.usedAt = new Date();
      }
    });
    mockResetTokens.set(tokenHash, { userId, expiresAt });
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    const entry = Object.entries(mockCredentials).find(([, credential]) => credential.userId === userId);

    if (entry) {
      const [, credential] = entry;
      credential.password = undefined;
      credential.passwordHash = passwordHash;
    }
  }

  async revokeAllSessionsForUser(userId: string) {
    mockSessions.forEach((session) => {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = new Date();
      }
    });
  }

  async consumePasswordResetToken(tokenHash: string, passwordHash: string) {
    const resetToken = mockResetTokens.get(tokenHash);

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const user = getMockUserById(resetToken.userId);

    if (!user) {
      return null;
    }

    await this.updateUserPassword(resetToken.userId, passwordHash);
    await this.revokeAllSessionsForUser(resetToken.userId);
    resetToken.usedAt = new Date();

    return user;
  }
}
