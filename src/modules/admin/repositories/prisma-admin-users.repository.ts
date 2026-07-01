import { prisma } from "@/lib/db/prisma";

export type OfficerAccessUser = {
  id: string;
  email: string;
  displayName: string;
  role: "OFFICER" | "CAREGIVER" | "ADMIN" | "DEVELOPER";
  status: "ACTIVE" | "DISABLED";
  sites: Array<{
    id: string;
    name: string;
    code: string;
    role: "SITE_OFFICER" | "SITE_MANAGER" | "SITE_VIEWER" | "CAREGIVER_VIEWER";
  }>;
};

function toOfficerAccessUser(user: {
  id: string;
  email: string;
  displayName: string;
  globalRole: OfficerAccessUser["role"];
  status: OfficerAccessUser["status"];
  siteRoles: Array<{
    role: OfficerAccessUser["sites"][number]["role"];
    site: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}): OfficerAccessUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.globalRole,
    status: user.status,
    sites: user.siteRoles.map((siteRole) => ({
      id: siteRole.site.id,
      name: siteRole.site.name,
      code: siteRole.site.code,
      role: siteRole.role
    }))
  };
}

export class PrismaAdminUsersRepository {
  async listOfficerAccessUsers(): Promise<OfficerAccessUser[]> {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { globalRole: { in: ["OFFICER", "ADMIN", "DEVELOPER"] } },
          { siteRoles: { some: { role: "SITE_OFFICER" } } }
        ]
      },
      include: {
        siteRoles: {
          include: {
            site: true
          },
          orderBy: {
            site: {
              name: "asc"
            }
          }
        }
      },
      orderBy: {
        displayName: "asc"
      }
    });

    return users.map(toOfficerAccessUser);
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
        displayName: true,
        globalRole: true
      }
    });
  }

  async grantSiteOfficerAccess(userId: string, siteId: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: userId },
        data: { globalRole: "OFFICER" }
      });

      await transaction.userSiteRole.upsert({
        where: {
          userId_siteId_role: {
            userId,
            siteId,
            role: "SITE_OFFICER"
          }
        },
        create: {
          userId,
          siteId,
          role: "SITE_OFFICER"
        },
        update: {}
      });

      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          siteRoles: {
            include: {
              site: true
            },
            orderBy: {
              site: {
                name: "asc"
              }
            }
          }
        }
      });

      return toOfficerAccessUser(user);
    });
  }
}
