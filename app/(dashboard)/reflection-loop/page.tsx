import type { Metadata } from "next";

import { ReflectionLoopFoundation } from "../../dashboard-action-foundations";

export const metadata: Metadata = {
  title: "Reflection Loop | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function ReflectionLoopPage() {
  return <ReflectionLoopFoundation />;
}
