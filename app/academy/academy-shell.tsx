import type { ReactNode } from "react";

import { SiteShell } from "@/src/components/site/site-shell";

export function AcademyShell({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
