import type { Metadata } from "next";

import { DashboardPanel, DashboardUnavailableState } from "../../../dashboard-template";
import { CoachReviewDeliveryScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readWhopAiReviewConfigurationHealth, readWhopAiReviewCustomerUrls } from "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { isWhopAiReviewEntitlementSchemaAvailable, WhopAiReviewEntitlementRepository } from "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { AccountSettingsLayout } from "../account-settings-layout";
import { AiReviewFrequencySettings } from "../ai-review-delivery-settings";
import { AiReviewSubscriptionStatus } from "../ai-review-subscription-status";
import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

export const metadata: Metadata = {
  description: "Manage TraderLink AI Review delivery and plan settings.",
  title: "AI & plan | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountAiPage() {
  if (!areTraderLinkPlatformAiFeaturesEnabled()) {
    return (
      <AccountSettingsLayout
        activeSection="ai"
        description="Links AI Chat and AI Reviews are being prepared for a later beta update."
        title="AI"
      >
        <DashboardUnavailableState
          compact
          description="There is no AI subscription or AI setup during the free beta. We will let you know when these features are ready."
          title="Coming soon"
        />
      </AccountSettingsLayout>
    );
  }

  const scope = await requireTraderLinkPlatformPageScope();
  const { aiReviewAccess, aiReviewSettings } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      aiReviewSettings: new CoachReviewDeliveryScheduleRepository(database).readV2(scope),
      aiReviewAccess: isWhopAiReviewEntitlementSchemaAvailable(database)
        ? new WhopAiReviewEntitlementRepository(database).readAccess(scope.userId)
        : null,
    }));
  const whopHealth = readWhopAiReviewConfigurationHealth();
  const whopUrls = readWhopAiReviewCustomerUrls();

  return (
    <AccountSettingsLayout
      activeSection="ai"
      description="Control when eligible AI Reviews are prepared and review your current TraderLink plan."
      title="AI & plan"
    >
      <DashboardPanel title="AI Review settings">
        <AiReviewFrequencySettings initialSettings={aiReviewSettings} />
      </DashboardPanel>
      <DashboardPanel title="AI Review subscription">
        <AiReviewSubscriptionStatus
          access={aiReviewAccess}
          billingPortalUrl={whopUrls.billingPortalUrl}
          checkoutUrl={whopUrls.checkoutUrl}
          configured={whopHealth.readyForEntitlement}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
