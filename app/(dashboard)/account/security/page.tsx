import type { Metadata } from "next";
import Alert from "@mui/material/Alert";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { PlatformSessionRepository } from "@/src/modules/platform/server/authentication/platform-session-repository";
import { PlatformSessionService } from "@/src/modules/platform/server/authentication/platform-session-service";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { AccountSessionControls } from "../account-session-controls";
import { AccountSettingsLayout } from "../account-settings-layout";

export const metadata: Metadata = {
  description: "Manage TraderLink sign-ins on this and other devices.",
  title: "Security | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<Readonly<{ sessionAction?: string }>>;
}) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const hasDiscordSession = identity.mode === "platform_session";
  const activeSessionCount = hasDiscordSession
    ? withReadonlyPlatformDatabase({}, (database) =>
      new PlatformSessionService(new PlatformSessionRepository(database))
        .countActiveForUser(identity.scope.userId))
    : 0;

  return (
    <AccountSettingsLayout
      activeSection="security"
      description="Manage where your TraderLink account stays signed in."
      title="Security"
    >
      <DashboardPanel title="Sessions">
        {(await searchParams).sessionAction === "unavailable" ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            TraderLink could not end every sign-in right now. Nothing was changed. Please try again.
          </Alert>
        ) : null}
        <AccountSessionControls activeSessionCount={activeSessionCount} hasDiscordSession={hasDiscordSession} />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
