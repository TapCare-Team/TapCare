import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/modules/auth/domain/access";

export class PrismaAuthRepository {
  async getSessionUserById(userId: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId, status: "ACTIVE" },
      include: {
        siteRoles: true,
        householdAssignments: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      displayName: user.displayName,
      role: user.globalRole,
      siteIds: user.siteRoles.map((role) => role.siteId),
      householdIds: user.householdAssignments
        .filter((assignment) => assignment.endedAt === null)
        .map((assignment) => assignment.householdId)
    };
  }

  async listLoginUsers() {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ globalRole: "asc" }, { displayName: "asc" }]
    });

    return users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      role: user.globalRole
    }));
  }
}
