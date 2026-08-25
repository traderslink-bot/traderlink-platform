import type { ReactNode } from "react";

import { HelpSiteHeader } from "./_components/help-site-header";

export default function PublicHelpLayout({ children }: { children: ReactNode }) {
  return <><HelpSiteHeader />{children}</>;
}
