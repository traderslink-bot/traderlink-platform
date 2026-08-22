import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { ACCOUNT_HELP_GUIDES } from "@/src/modules/help/account-guides";

export const metadata: Metadata = {
  description: "Manage your TraderLink settings and sign-ins.",
  title: "Account Help | TraderLink Platform",
};

export default function AccountHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/account/trading", label: "Open Account settings", variant: "contained" as const }),
        Object.freeze({ href: "/account/security", label: "Open Security", variant: "outlined" as const }),
      ])}
      description="Manage your TraderLink settings, use the Account menu and keep control of where your account stays signed in."
      guides={ACCOUNT_HELP_GUIDES}
      highlights={Object.freeze([
        "The Account menu gives you a quick way to open settings or log out.",
        "Sign out everywhere ends active TraderLink sessions, not your Discord account.",
      ])}
      href="/help/account"
      steps={Object.freeze([
        Object.freeze({ title: "Open the Account menu", description: "Select the person icon at the top right of TraderLink." }),
        Object.freeze({ title: "Choose Security", description: "Review your active TraderLink sign-ins." }),
        Object.freeze({ title: "End sessions when needed", description: "Log out on this device or deliberately sign out everywhere." }),
      ])}
      title="Account"
    />
  );
}
