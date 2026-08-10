import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES } from "@/src/modules/help/notifications-and-imports-guides";

export const metadata: Metadata = {
  description: "Find TraderLink updates, choose Discord messages and finish a statement that needs help.",
  title: "Notifications and imports Help | TraderLink Platform",
};

export default function NotificationsAndImportsHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/notifications", label: "Open Notifications", variant: "contained" as const }),
        Object.freeze({ href: "/imports", label: "Open Import Trades", variant: "outlined" as const }),
      ])}
      description="Find updates, choose which messages you want, and get a statement moving again when its layout needs extra help."
      guides={NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES}
      highlights={Object.freeze([
        "Every update remains available in Notifications, whether or not you choose Discord messages.",
        "A stopped statement import does not change the trades already in your journal.",
        "You can allow a private statement review or map the columns yourself.",
      ])}
      href="/help/notifications-and-imports"
      steps={Object.freeze([
        Object.freeze({ title: "Check updates", description: "Open the bell or the Notifications page to see what finished and what needs attention." }),
        Object.freeze({ title: "Choose messages", description: "Use Account settings to choose which updates may also arrive by Discord." }),
        Object.freeze({ title: "Finish the import", description: "Choose private statement review or map the columns yourself when a statement stops." }),
      ])}
      title="Notifications and imports"
    />
  );
}
