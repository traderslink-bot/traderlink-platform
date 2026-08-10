"use client";

import { FeatureHelpLink } from "../feature-help-link";

export function TradeAnalyzerHelpLink({
  href,
  label,
  size = "small",
}: {
  href: string;
  label: string;
  size?: "small" | "medium";
}) {
  return <FeatureHelpLink href={href} label={label} size={size} />;
}
