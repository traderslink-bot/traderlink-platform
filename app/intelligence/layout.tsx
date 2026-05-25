import type { ReactNode } from "react";

import { SiteShell } from "@/src/components/site/site-shell";

export default function IntelligenceLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      sectionHref="/intelligence"
      sectionLabel="Intelligence"
      shellElement="div"
    >
      {children}
    </SiteShell>
  );
}
