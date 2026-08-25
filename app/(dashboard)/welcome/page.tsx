import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardPage, DashboardPanel, DashboardPrimaryAction } from "../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNewsletterContactRepository } from "@/src/modules/platform/server/newsletter/platform-newsletter-contact-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { normalizeDiscordAuthReturnTo } from "@/src/lib/academy/discord-auth-return";
import { recordNewsletterSignupChoice } from "./newsletter-welcome-actions";

export const metadata: Metadata = {
  title: "Welcome | TradersLink Platform",
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

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Welcome to TradersLink</Typography>
      <DashboardPanel title="The Week Ahead">
        <form action={continueToTraderLink}>
          <Stack spacing={2} sx={{ maxWidth: 680 }}>
            <Typography color="text.secondary" variant="body1">
              Your TraderLink account is connected to Discord.
            </Typography>
            {newsletter.hasVerifiedDiscordEmail ? (
              <>
                <FormControlLabel
                  control={<Checkbox name="weekAheadNewsletter" value="yes" />}
                  label="Send me The Week Ahead — a weekly look at small-cap stocks and upcoming catalysts to research — plus occasional TradersLink product, education, and community updates."
                  sx={{ alignItems: "flex-start", m: 0 }}
                />
                <Typography color="text.secondary" variant="body2">
                  Research ideas, not trade recommendations. Unsubscribe anytime.
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Discord did not share a verified email address, so newsletter sign-up is not available yet.
              </Typography>
            )}
            <DashboardPrimaryAction type="submit" sx={{ alignSelf: "flex-start" }}>
              Continue to TradersLink
            </DashboardPrimaryAction>
          </Stack>
        </form>
      </DashboardPanel>
    </DashboardPage>
  );
}
