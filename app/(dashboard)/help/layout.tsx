import type { ReactNode } from "react";

import { HELP_NAVIGATION_ITEMS } from "@/src/modules/help/help-content-registry";
import { HelpCenterLayout } from "./help-center-layout";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <HelpCenterLayout navigationItems={HELP_NAVIGATION_ITEMS}>
      {children}
    </HelpCenterLayout>
  );
}
