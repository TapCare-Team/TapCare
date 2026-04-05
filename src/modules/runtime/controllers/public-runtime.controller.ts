import { recordRenderedRuntimePage, resolvePublicRuntime } from "@/modules/runtime/services/public-runtime.service";

export async function loadPublicRuntime(publicCode: string) {
  return resolvePublicRuntime(publicCode);
}

export async function acknowledgeRenderedRuntimePage(
  resolution: Awaited<ReturnType<typeof resolvePublicRuntime>>
) {
  if (resolution.kind !== "RENDER_PAGE") {
    return;
  }

  await recordRenderedRuntimePage(resolution);
}
