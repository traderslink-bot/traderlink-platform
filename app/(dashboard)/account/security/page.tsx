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
  const query = await searchParams;
  const identity = await requireTraderLinkPlatformPageIdentity();
  const hasDiscordSession = identity.mode === "platform_session";
  const activeSessions = hasDiscordSession
    ? withReadonlyPlatformDatabase({}, (database) =>
      new PlatformSessionService(new PlatformSessionRepository(database))
        .listActiveForUser(identity.scope.userId))
    : Object.freeze([]);

  return (
    <AccountSettingsLayout
      activeSection="security"
      description="Manage where your TraderLink account stays signed in."
      title="Security"
    >
      <DashboardPanel title="Sessions">
        {query.sessionAction === "unavailable" ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            TraderLink could not end every sign-in right now. Nothing was changed. Please try again.
          </Alert>
        ) : null}
        {query.sessionAction === "ended" ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            The selected sign-in was ended.
          </Alert>
        ) : null}
        <AccountSessionControls
          activeSessions={activeSessions}
          currentSessionId={identity.sessionId}
          hasDiscordSession={hasDiscordSession}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
