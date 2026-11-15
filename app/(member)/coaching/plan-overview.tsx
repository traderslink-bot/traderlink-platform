"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardPanel } from "@/app/dashboard-template";
import type { IndependentCoachWorkRow } from "@/src/modules/communities/server/independent-coaching-work-read";
import {
  CoachingPlanSummaryDrawer,
  type CoachingPlanStudentSummary,
  type CoachingPlanSummarySelection,
} from "./plan-summary-drawer";
export type CoachingPlanOverviewRow = {
  planId: string;
  name: string;
  status: string;
  students: readonly CoachingPlanStudentSummary[];
  work: readonly IndependentCoachWorkRow[];
  attentionEnrollmentIds: readonly string[];
};
export function IndependentCoachingPlanOverview({
  plans,
  nowUtc,
}: {
  plans: readonly CoachingPlanOverviewRow[];
  nowUtc: string;
}) {
  const [selection, setSelection] =
    useState<CoachingPlanSummarySelection>(null);
  const open = (
    plan: CoachingPlanOverviewRow,
    kind: NonNullable<CoachingPlanSummarySelection>["kind"],
    title: string,
    work: readonly IndependentCoachWorkRow[] = [],
  ) =>
    setSelection({
      planId: plan.planId,
      planName: plan.name,
      kind,
      title,
      students: plan.students,
      work,
    });
  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        sx={{
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Typography component="h1" variant="h1">
          Coach plans
        </Typography>
        <Button href="/coaching/plans/new" variant="contained">
          Create plan
        </Button>
      </Stack>
      <DashboardPanel hideHeader>
        <Stack spacing={2}>
          {plans.length ? (
            plans.map((plan) => {
              const overdue = plan.work.filter((row) => row.dueAtUtc < nowUtc),
                attention = plan.work.filter(
                  (row) =>
                    row.dueAtUtc < nowUtc ||
                    plan.attentionEnrollmentIds.includes(row.enrollmentId),
                );
              return (
                <Box
                  key={plan.planId}
                  sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    sx={{
                      alignItems: { md: "center" },
                      gap: 2,
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography component="h2" variant="h3">
                        {plan.name}
                      </Typography>
                      <Typography
                        color={
                          plan.status === "active"
                            ? "success.main"
                            : "text.secondary"
                        }
                      >
                        {plan.status}
                      </Typography>
                    </Box>
                    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                      <Button
                        onClick={() =>
                          open(plan, "students", "Active students")
                        }
                      >
                        Active Students ({plan.students.length})
                      </Button>
                      <Button
                        onClick={() =>
                          open(plan, "overdue", "Overdue work", overdue)
                        }
                      >
                        Overdue ({overdue.length})
                      </Button>
                      <Button
                        onClick={() =>
                          open(plan, "attention", "Needs Attention", attention)
                        }
                      >
                        Needs Attention ({attention.length})
                      </Button>
                      <Button
                        variant="outlined"
                        href={`/coaching/plans/${plan.planId}`}
                      >
                        Open plan
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            })
          ) : (
            <Typography>No plans yet.</Typography>
          )}
        </Stack>
      </DashboardPanel>
      <CoachingPlanSummaryDrawer
        selection={selection}
        nowUtc={nowUtc}
        onClose={() => setSelection(null)}
        returnTo="/coaching/plans"
      />
    </Stack>
  );
}
