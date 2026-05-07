import { mockUsers } from "@/lib/mock-data";
import type { SessionUser } from "@/modules/auth/domain/access";

export class MockAuthRepository {
  async getSessionUserById(userId: string): Promise<SessionUser | null> {
    return Object.values(mockUsers).find((user) => user.id === userId) ?? null;
  }

  async listLoginUsers(): Promise<Array<Pick<SessionUser, "id" | "displayName" | "role">>> {
    return Object.values(mockUsers).map((user) => ({
      id: user.id,
      displayName: user.displayName,
      role: user.role
    }));
  }
}
