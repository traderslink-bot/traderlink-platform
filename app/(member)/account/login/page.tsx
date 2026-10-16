import { DiscordConnectionNotice } from "@/app/discord-connection-notice";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readMembershipDiscordConnection } from "@/src/modules/platform/server/membership/membership-discord-connection";
import { cookies } from "next/headers";
import { requireTraderLinkPlatformBillingPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { loginOperation } from "@/src/modules/platform/server/authentication/platform-login-http";
import { googleLoginConfigured } from "@/src/modules/platform/server/authentication/platform-google-oauth";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";
import { DashboardPanel } from "../../../dashboard-template";
import { AccountSettingsLayout } from "../../../(dashboard)/account/account-settings-layout";
import { ConnectedMethods } from "./connected-methods";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Login methods | TradersLink",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const identity = await requireTraderLinkPlatformBillingPageIdentity();
  const discord = withReadonlyPlatformDatabase({}, database => readMembershipDiscordConnection(database, identity.scope.userId));
  const token =
    (await cookies()).get(TRADERLINK_PLATFORM_SESSION_COOKIE)?.value ?? null;
  const methods = loginOperation((s) => s.connected(token)).map(
    (m) => m.provider,
  );
  return (
    <AccountSettingsLayout
      activeSection="login"
      title="Login methods"
      description=""
    >
      <DiscordConnectionNotice {...discord} showJoined />
      <DashboardPanel title="Connected login methods">
        <ConnectedMethods
          methods={methods}
          googleAvailable={googleLoginConfigured()}
          discordAvailable={Boolean(
            process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
          )}
          emailAvailable={Boolean(
            process.env.RESEND_API_KEY &&
              process.env.TRADERLINK_LOGIN_EMAIL_FROM,
          )}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
