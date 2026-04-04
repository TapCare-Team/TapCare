import { mockUsers } from "@/lib/mock-data";

export async function getCurrentUser(role: "officer" | "caregiver" | "admin" = "officer") {
  return mockUsers[role];
}
