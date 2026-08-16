import { getDataMode } from "@/lib/db/database-mode";
import { MockFollowUpStateRepository } from "@/modules/signals/repositories/mock-follow-up-state.repository";
import { PrismaFollowUpStateRepository } from "@/modules/signals/repositories/prisma-follow-up-state.repository";

const mockFollowUpStateRepository = new MockFollowUpStateRepository();
const prismaFollowUpStateRepository = new PrismaFollowUpStateRepository();

export function getFollowUpStateRepository() {
  return getDataMode() === "database" ? prismaFollowUpStateRepository : mockFollowUpStateRepository;
}
