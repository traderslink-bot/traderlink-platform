import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { DATA_DECISIONS_HELP_GUIDES } from "@/src/modules/help/data-decisions-guides";

export const metadata: Metadata = { description: "Learn how to answer factual Trade Tracker questions from your broker evidence.", title: "Data Decisions Help | TraderLink Platform" };

export default function DataDecisionsHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/data-decisions", label: "Open Data Decisions", variant: "contained" as const }), Object.freeze({ href: "/imports", label: "Open Import Trades", variant: "outlined" as const })])} description="Review the exact factual question that needs your broker evidence while unrelated accepted trades remain available." guides={DATA_DECISIONS_HELP_GUIDES} highlights={Object.freeze(["Data Decisions asks about source facts, not whether a trade was good or bad.", "Use the broker statement to support the answer; do not guess a value to complete a trade.", "A reviewed decision rebuilds the affected facts without hiding unrelated valid trades."])} href="/help/data-decisions" steps={Object.freeze([Object.freeze({ title: "Read the question", description: "Open the pending trade or statement issue and compare the details." }), Object.freeze({ title: "Choose the fact", description: "Use the action that matches your broker evidence." }), Object.freeze({ title: "Save and review", description: "Confirm the updated state and move to the next factual question only when needed." })])} title="Data Decisions" />;
}
