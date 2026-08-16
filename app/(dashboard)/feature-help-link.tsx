"use client";

type FeatureHelpLinkProps = Readonly<{
  href: string;
  label: string;
  size?: "small" | "medium";
}>;

/**
 * Retained as a compatibility shim while page-local callers are removed.
 * DashboardShell now owns the only visible, route-level Help link.
 */
export function FeatureHelpLink(props: FeatureHelpLinkProps) {
  void props;
  return null;
}
