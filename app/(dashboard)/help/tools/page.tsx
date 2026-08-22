import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TOOLS_HELP_GUIDES } from "@/src/modules/help/tools-guides";

export const metadata: Metadata = {
  description: "Learn how to use TraderLink tools, starting with Halt Alerts.",
  title: "Tools Help | TraderLink Platform",
};

export default function ToolsHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/workspace", label: "Open Workspace", variant: "contained" as const }),
      ])}
      guides={TOOLS_HELP_GUIDES}
      highlights={Object.freeze([
        "Tools are optional and can be turned on only when you want to use them.",
        "Each guide explains the available controls in plain language.",
      ])}
      href="/help/tools"
      steps={Object.freeze([
        Object.freeze({ title: "Choose a tool", description: "Open the guide for the TradersLink tool you want to use." }),
        Object.freeze({ title: "Set it up", description: "Use the guide's steps to choose the controls that work for you." }),
        Object.freeze({ title: "Adjust anytime", description: "Return to the tool whenever you want to change its settings." }),
      ])}
      title="Tools"
    />
  );
}
