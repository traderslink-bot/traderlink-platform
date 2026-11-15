"use client";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { IndependentCoachWorkRow } from "@/src/modules/communities/server/independent-coaching-work-read";
import { IndependentCoachingWorkList } from "./work-list";
export type CoachingPlanStudentSummary = {
  studentId: string;
  name: string;
  avatarUrl: string | null;
};
export type CoachingPlanSummarySelection = {
  planId: string;
  planName: string;
  kind: "students" | "due" | "overdue" | "attention";
  title: string;
  students: readonly CoachingPlanStudentSummary[];
  work: readonly IndependentCoachWorkRow[];
} | null;
export function CoachingPlanSummaryDrawer({
  selection,
  nowUtc,
  onClose,
  returnTo,
}: {
  selection: CoachingPlanSummarySelection;
  nowUtc: string;
  onClose: () => void;
  returnTo: string;
}) {
  const titleId = "coaching-plan-summary-drawer-title";
  return (
    <Drawer
      anchor="right"
      open={selection !== null}
      onClose={onClose}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100vw", md: 760 },
            maxWidth: "100vw",
            height: "100dvh",
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          p: 2,
          alignItems: "center",
          gap: 2,
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={titleId} component="h2" variant="h2">
            {selection?.title ?? "Plan details"}
          </Typography>
          {selection ? (
            <Typography variant="body2" color="text.secondary">
              {selection.planName}
            </Typography>
          ) : null}
        </Box>
        <Button onClick={onClose}>Close</Button>
      </Stack>
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {selection?.kind === "students" ? (
          selection.students.length ? (
            selection.students.map((student) => (
              <Stack
                key={student.studentId}
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Avatar src={student.avatarUrl ?? undefined} alt={student.name}>
                  {student.name.slice(0, 1)}
                </Avatar>
                <Typography sx={{ flex: 1, fontWeight: 600 }}>
                  {student.name}
                </Typography>
                <Button
                  href={`/coaching/students#${new URLSearchParams({ student: student.studentId, section: "plans" })}`}
                  variant="outlined"
                >
                  Open student
                </Button>
              </Stack>
            ))
          ) : (
            <Typography>No active students in this plan.</Typography>
          )
        ) : selection ? (
          <IndependentCoachingWorkList
            work={selection.work}
            nowUtc={nowUtc}
            returnTo={returnTo}
          />
        ) : null}
      </Stack>
    </Drawer>
  );
}
