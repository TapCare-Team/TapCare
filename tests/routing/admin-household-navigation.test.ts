import { createElement, type ComponentProps, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/shared/app-shell";
import type { SessionUser } from "@/modules/auth/domain/access";

vi.mock("@/lib/auth", () => ({ requireUserWithRole: vi.fn() }));
vi.mock("@/lib/db/database-mode", () => ({ isDatabaseConfigured: () => false }));
vi.mock("@/modules/households/services/household-management.service", () => ({
  listCreatableSitesForUser: vi.fn()
}));
vi.mock("@/modules/households/services/household-analytics.service", () => ({
  getHouseholdDetail: vi.fn(),
  getSignalsForSites: vi.fn()
}));

import { requireUserWithRole } from "@/lib/auth";
import { listCreatableSitesForUser } from "@/modules/households/services/household-management.service";
import { getHouseholdDetail, getSignalsForSites } from "@/modules/households/services/household-analytics.service";
import HouseholdsPage from "@/app/(management)/households/page";
import NewHouseholdPage from "@/app/(management)/households/new/page";
import HouseholdDetailPage from "@/app/(management)/households/[householdId]/page";
import FollowUpQueuePage from "@/app/(management)/follow-up/page";

const admin: SessionUser = {
  id: "admin-1",
  displayName: "Test admin",
  role: "ADMIN",
  siteIds: [],
  householdIds: []
};

function renderNavigation(page: ReactElement<ComponentProps<typeof AppShell>>) {
  return renderToStaticMarkup(createElement(AppShell, { ...page.props, children: null }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUserWithRole).mockResolvedValue(admin);
  vi.mocked(listCreatableSitesForUser).mockResolvedValue([]);
  vi.mocked(getSignalsForSites).mockResolvedValue([]);
  vi.mocked(getHouseholdDetail).mockResolvedValue({
    household: {
      id: "household-1",
      siteId: "site-1",
      siteName: "Test site",
      addressLine1: "Blk 18 Bedok South Road",
      displayAddress: "Blk 18 Bedok South Road",
      seniorAliases: [],
      caregiverIds: [],
      caregiverAssignments: [],
      stickers: []
    },
    recentEvents: [],
    signals: [],
    featureSnapshots: [],
    activityWindow: { preset: "7d", from: "", to: "" },
    activityBounds: { earliest: "", latest: "" }
  });
});

describe("admin household navigation", () => {
  it("redirects the old household list URL to the admin dashboard", () => {
    expect(HouseholdsPage).toThrow(
      expect.objectContaining({ digest: "NEXT_REDIRECT;replace;/admin;307;" })
    );
  });

  it("returns from household creation to the admin household list", async () => {
    const markup = renderNavigation(await NewHouseholdPage());
    expect(markup).toMatch(/<a[^>]+href="\/admin"[^>]*>Household list<\/a>/);
  });

  it("returns from household details to the admin household list", async () => {
    const markup = renderNavigation(await HouseholdDetailPage({ params: { householdId: "household-1" } }));
    expect(markup).toMatch(/<a[^>]+href="\/admin"[^>]*>Household list<\/a>/);
  });

  it("returns from follow-up review to the admin household list", async () => {
    const markup = renderNavigation(await FollowUpQueuePage({}));
    expect(markup).toMatch(/<a[^>]+href="\/admin"[^>]*>Households<\/a>/);
  });
});
