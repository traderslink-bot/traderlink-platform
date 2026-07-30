"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DashboardPage } from "../../dashboard-template";

import { ExecutionEntryCard } from "./execution-entry-card";

export function TradeTrackerWorkingDay({
  sessionDate,
}: {
  sessionDate: string;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DashboardPage>
      <ExecutionEntryCard
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onSubmitted={() => {
          router.replace(`/trade-tracker/${sessionDate}`);
          router.refresh();
        }}
        persist
        sessionDate={sessionDate}
        submittedCount={null}
      />
    </DashboardPage>
  );
}
