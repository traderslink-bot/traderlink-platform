import type { Metadata } from "next";

import { ImportTradesFoundation } from "../../dashboard-action-foundations";

export const metadata: Metadata = {
  title: "Import Trades | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  return <ImportTradesFoundation />;
}
