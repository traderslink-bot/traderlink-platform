import type { ReactNode } from "react";

import { PublicSiteHeader } from "../public-site-header";

export default function PublicHelpLayout({ children }: { children: ReactNode }) {
  return <><PublicSiteHeader />{children}</>;
}
