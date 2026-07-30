"use client";

import { useState } from "react";

import { DashboardPage } from "../../dashboard-template";

import { getDaySessionDesignPreview } from "./[sessionDate]/day-session-preview-data";
import { DaySessionView } from "./[sessionDate]/day-session-view";
import { ExecutionEntryCard } from "./execution-entry-card";

export function TradeTrackerWorkingDayPreview({
  sessionDate,
}: {
  sessionDate: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const executionEntry = (
    <ExecutionEntryCard
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      onSubmitted={setSubmittedCount}
      sessionDate={sessionDate}
      submittedCount={submittedCount}
    />
  );

  if (submittedCount === null) {
    return <DashboardPage>{executionEntry}</DashboardPage>;
  }

  return (
    <DaySessionView
      data={getDaySessionDesignPreview(sessionDate)}
      designPreview
      topContent={executionEntry}
    />
  );
}
