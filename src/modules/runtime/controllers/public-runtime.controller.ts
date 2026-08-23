import { resolvePublicRuntime } from "@/modules/runtime/services/public-runtime.service";

export async function loadPublicRuntime(publicCode: string, publicClientId?: string) {
  return resolvePublicRuntime(publicCode, publicClientId);
}
