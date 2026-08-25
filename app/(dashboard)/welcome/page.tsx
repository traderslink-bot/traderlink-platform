import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNewsletterContactRepository } from "@/src/modules/platform/server/newsletter/platform-newsletter-contact-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { normalizeDiscordAuthReturnTo } from "@/src/lib/academy/discord-auth-return";
import { recordNewsletterSignupChoice } from "./newsletter-welcome-actions";
import { NewsletterOptInOffer } from "./newsletter-opt-in-offer";

export const metadata: Metadata = {
  title: "The Week Ahead | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const [scope, resolvedSearchParams] = await Promise.all([
    requireTraderLinkPlatformPageScope(),
    searchParams,
  ]);
  const returnTo = normalizeDiscordAuthReturnTo(resolvedSearchParams.returnTo);
  const newsletter = withReadonlyPlatformDatabase({}, (database) => {
    try {
      return new PlatformNewsletterContactRepository(
        database,
        loadPlatformNotificationEmailEncryptionConfiguration(),
      ).readStatus(scope.userId);
    } catch {
      return Object.freeze({
        hasVerifiedDiscordEmail: false,
        newsletterConsentState: "unavailable" as const,
      });
    }
  });

  async function continueToTraderLink(formData: FormData): Promise<void> {
    "use server";
    if (newsletter.hasVerifiedDiscordEmail) {
      await recordNewsletterSignupChoice(formData.get("weekAheadNewsletter") === "yes");
    }
    redirect(returnTo);
  }

  return <NewsletterOptInOffer canSubscribe={newsletter.hasVerifiedDiscordEmail} formAction={continueToTraderLink} />;
}
