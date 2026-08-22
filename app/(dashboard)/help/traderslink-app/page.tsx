import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TRADERSLINK_APP_HELP_GUIDES } from "@/src/modules/help/traderslink-app-guides";

export const metadata: Metadata = {
  description: "Install TradersLink, use saved pages and trade entry offline, manage device storage and choose push alerts.",
  title: "TradersLink app Help | TraderLink Platform",
};

export default function TradersLinkAppHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/account/trading#pwa-app", label: "Open App settings", variant: "contained" as const }),
        Object.freeze({ href: "/account/preferences#push-notifications", label: "Open Push notifications", variant: "outlined" as const }),
      ])}
      description="Install TradersLink and understand what stays on your device, what you can do offline and how alerts work."
      guides={TRADERSLINK_APP_HELP_GUIDES}
      highlights={Object.freeze([
        "The installed app keeps the normal TradersLink dashboard and navigation.",
        "Saved pages are last-updated copies, not a backup or a second Journal.",
        "Offline trades stay outside your trading results until TraderLink accepts them after you reconnect.",
        "Push alerts are always optional and chosen separately for each device.",
      ])}
      href="/help/traderslink-app"
      steps={Object.freeze([
        Object.freeze({ title: "Install", description: "Use the in-app message, browser menu or Add to Home Screen to install TradersLink." }),
        Object.freeze({ title: "Open online first", description: "Open the pages and trade-entry tools you want available on this device." }),
        Object.freeze({ title: "Use offline support", description: "Read saved pages or save an offline manual trade when your connection is unavailable." }),
        Object.freeze({ title: "Reconnect", description: "Let TraderLink check and save pending trades before relying on them in your results." }),
      ])}
      title="TradersLink app"
    />
  );
}
