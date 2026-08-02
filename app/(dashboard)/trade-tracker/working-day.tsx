"use client";

import { useState } from "react";

import { DashboardPage } from "../../dashboard-template";

import { getDaySessionDesignPreview } from "./[sessionDate]/day-session-preview-data";
import type { WorkingDayReviewConfiguration } from "./[sessionDate]/day-session-preview-data";
import { DaySessionView } from "./[sessionDate]/day-session-view";
import { ExecutionEntryCard } from "./execution-entry-card";
import type { ExecutionDraft } from "./execution-entry-card";

export function TradeTrackerWorkingDay({
  reviewConfiguration,
  sessionDate,
}: {
  reviewConfiguration: WorkingDayReviewConfiguration;
  sessionDate: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [submittedExecutions, setSubmittedExecutions] = useState<
    ExecutionDraft[]
  >([]);
  const executionEntry = (
    <ExecutionEntryCard
      collapsed={collapsed}
      initialExecutions={submittedExecutions}
      onCollapsedChange={setCollapsed}
      onSubmitted={(count, executions) => {
        setSubmittedCount(count);
        setSubmittedExecutions(executions);
      }}
      sessionDate={sessionDate}
      submittedCount={submittedCount}
    />
  );

  if (submittedCount === null) {
    return <DashboardPage>{executionEntry}</DashboardPage>;
  }

  return (
    <DaySessionView
      data={getDaySessionDesignPreview(
        sessionDate,
        submittedExecutions,
        reviewConfiguration,
      )}
      pendingExecutions
      topContent={executionEntry}
    />
  );
}
