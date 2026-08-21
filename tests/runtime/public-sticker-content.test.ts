import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { trackedLink } = vi.hoisted(() => ({ trackedLink: vi.fn() }));
vi.mock("@/components/runtime/tracked-public-action-link", () => ({
  TrackedPublicActionLink: (props: unknown) => {
    trackedLink(props);
    return null;
  }
}));

import { PublicStickerContent } from "@/components/runtime/public-sticker-content";

describe("PublicStickerContent preview mode", () => {
  it("uses the same interpreted actions without creating tracked links", () => {
    const checklist = renderToStaticMarkup(createElement(PublicStickerContent, { page: { pageType: "CHECKLIST", title: "Checklist", content: { checklistItems: ["Stretching video | https://example.org/video"] } } }));
    const profile = renderToStaticMarkup(createElement(PublicStickerContent, { page: { pageType: "HELP_PROFILE", title: "Profile", content: { helpFields: [{ label: "Contact", value: "+6591234567" }] } } }));
    expect(checklist).toContain('href="https://example.org/video"');
    expect(profile).toContain('href="tel:+6591234567"');
    expect(profile).toContain("Call contact");
    expect(trackedLink).not.toHaveBeenCalled();
  });
});
