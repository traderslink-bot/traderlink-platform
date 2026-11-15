"use client";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPanel } from "@/app/dashboard-template";
import type { IndependentCoachWorkRow } from "@/src/modules/communities/server/independent-coaching-work-read";
import { IndependentCoachingWorkList } from "./work-list";
import {
  CoachingPlanSummaryDrawer,
  type CoachingPlanStudentSummary,
  type CoachingPlanSummarySelection,
} from "./plan-summary-drawer";
import {
  addCalendarDays,
  easternDay,
  validDay,
  workLabel,
  workState,
  workType,
  type IndependentWorkPlan,
} from "./work-presentation";

function pageNumber(value: string | null, max: number) {
  return Math.min(max, Math.max(1, Math.floor(Number(value) || 1)));
}
export function IndependentCoachingWorkBoard({
  work,
  plans,
  planStudents,
  nowUtc,
}: {
  work: readonly IndependentCoachWorkRow[];
  plans: readonly IndependentWorkPlan[];
  planStudents: Readonly<Record<string, readonly CoachingPlanStudentSummary[]>>;
  nowUtc: string;
}) {
  const params = useSearchParams(),
    pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [planSummary, setPlanSummary] =
    useState<CoachingPlanSummarySelection>(null);
  const today = easternDay(nowUtc),
    days = Math.max(
      1,
      Math.min(365, Math.floor(Number(params.get("days")) || 5)),
    ),
    custom = params.get("range") === "custom";
  const from = custom ? (params.get("from") ?? today) : today,
    through = custom
      ? (params.get("through") ?? addCalendarDays(today, days - 1))
      : addCalendarDays(today, days - 1);
  const invalid = !validDay(from) || !validDay(through) || from > through;
  const scope =
      params.get("scope") === "overdue"
        ? "overdue"
        : params.get("scope") === "all"
          ? "all"
          : "upcoming",
    q = params.get("q") ?? "",
    plan = params.get("plan") ?? "",
    kind = params.get("kind") ?? "",
    state = params.get("state") ?? "";
  function change(values: Record<string, string>, resetWork = true) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetWork) next.delete("workPage");
    window.history.replaceState(
      null,
      "",
      `${pathname}${next.size ? `?${next}` : ""}`,
    );
  }
  const search = q.trim().toLocaleLowerCase();
  const matching = work.filter(
    (row) =>
      (!plan || row.planId === plan) &&
      (!kind || workType(row) === kind) &&
      (!state || workState(row) === state) &&
      (!search ||
        `${row.studentName} ${row.planName} ${workLabel(row)}`
          .toLocaleLowerCase()
          .includes(search)),
  );
  const inPeriod = (row: IndependentCoachWorkRow) =>
    !invalid &&
    easternDay(row.dueAtUtc) >= from &&
    easternDay(row.dueAtUtc) <= through;
  const overdue = matching.filter((row) => row.dueAtUtc < nowUtc);
  const rows = matching
    .filter((row) =>
      scope === "overdue"
        ? row.dueAtUtc < nowUtc
        : scope === "all"
          ? true
          : inPeriod(row),
    )
    .sort(
      (a, b) =>
        a.dueAtUtc.localeCompare(b.dueAtUtc) ||
        String(a.reviewId ?? a.workId).localeCompare(
          String(b.reviewId ?? b.workId),
        ),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    page = pageNumber(params.get("workPage"), pages);
  const planPages = Math.max(1, Math.ceil(plans.length / 5)),
    planPage = pageNumber(params.get("plansPage"), planPages);
  const types = [
      ...new Map(work.map((row) => [workType(row), workLabel(row)])).entries(),
    ],
    states = [...new Set(work.map(workState))];
  const currentReturn = `${pathname}${params.size ? `?${params}` : ""}`;
  const clear = () =>
    change({
      q: "",
      plan: "",
      kind: "",
      state: "",
      scope: "",
      range: "",
      days: "",
      from: "",
      through: "",
    });
  const active = [
    ...(q ? [{ key: "q", label: `Search: ${q}` }] : []),
    ...(plan
      ? [
          {
            key: "plan",
            label: `Plan: ${plans.find((item) => item.planId === plan)?.name ?? "Unavailable plan"}`,
          },
        ]
      : []),
    ...(kind
      ? [
          {
            key: "kind",
            label:
              types.find(([type]) => type === kind)?.[1] ??
              "Unavailable work type",
          },
        ]
      : []),
    ...(state ? [{ key: "state", label: state }] : []),
  ];
  return (
    <Stack spacing={3}>
      <DashboardPanel title="Work period">
        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{ gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}
          >
            <TextField
              size="small"
              label="Period"
              select
              value={custom ? "custom" : "days"}
              sx={{ width: 180 }}
              onChange={(event) =>
                change({
                  range: event.target.value === "custom" ? "custom" : "",
                })
              }
            >
              <MenuItem value="days">Upcoming days</MenuItem>
              <MenuItem value="custom">Custom dates</MenuItem>
            </TextField>
            {custom ? (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={from}
                  onChange={(event) => change({ from: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="Through"
                  value={through}
                  onChange={(event) => change({ through: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            ) : (
              <TextField
                size="small"
                type="number"
                label="Number of days"
                sx={{ width: 160 }}
                value={days}
                onChange={(event) => change({ days: event.target.value })}
                slotProps={{ htmlInput: { min: 1, max: 365, step: 1 } }}
              />
            )}
            <TextField
              size="small"
              label="Find student or plan"
              value={q}
              onChange={(event) => change({ q: event.target.value })}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />
            <Button
              variant="outlined"
              aria-expanded={filtersOpen}
              aria-controls="independent-work-filters"
              onClick={() => setFiltersOpen((value) => !value)}
            >
              {active.length ? `Filters (${active.length})` : "Filters"}
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Deadlines and dates use Eastern Time. Only scheduled or submitted
            work appears here.
          </Typography>
          {invalid ? (
            <Alert
              severity="error"
              action={
                <Button
                  onClick={() => change({ range: "", from: "", through: "" })}
                >
                  Reset dates
                </Button>
              }
            >
              Choose valid dates with Through on or after From.
            </Alert>
          ) : null}
          <Collapse in={filtersOpen} id="independent-work-filters">
            <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap", pt: 1 }}>
              <TextField
                size="small"
                select
                label="Plan"
                value={plan}
                onChange={(event) => change({ plan: event.target.value })}
                sx={{ width: 240 }}
              >
                <MenuItem value="">All plans</MenuItem>
                {plans.map((item) => (
                  <MenuItem key={item.planId} value={item.planId}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                select
                label="Work type"
                value={kind}
                onChange={(event) => change({ kind: event.target.value })}
                sx={{ width: 220 }}
              >
                <MenuItem value="">All work types</MenuItem>
                {types.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                select
                label="Progress"
                value={state}
                onChange={(event) => change({ state: event.target.value })}
                sx={{ width: 200 }}
              >
                <MenuItem value="">All progress</MenuItem>
                {states.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Collapse>
          {active.length ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              {active.map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  onDelete={() => change({ [filter.key]: "" })}
                />
              ))}
              <Button onClick={clear}>Clear filters</Button>
            </Stack>
          ) : null}
        </Stack>
      </DashboardPanel>
      <DashboardPanel
        title="Plans"
        action={<Button href="/coaching/plans">View all plans</Button>}
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Work due:{" "}
            {invalid ? "choose valid dates" : `${from} through ${through}`}
          </Typography>
          {!plans.length ? (
            <Typography>No coaching plans yet.</Typography>
          ) : (
            plans.slice((planPage - 1) * 5, planPage * 5).map((item) => {
              const dueWork = work.filter(
                  (row) => row.planId === item.planId && inPeriod(row),
                ),
                lateWork = work.filter(
                  (row) => row.planId === item.planId && row.dueAtUtc < nowUtc,
                ),
                students = planStudents[item.planId] ?? [];
              const open = (
                kind: NonNullable<CoachingPlanSummarySelection>["kind"],
                title: string,
                selectedWork: readonly IndependentCoachWorkRow[] = [],
              ) =>
                setPlanSummary({
                  planId: item.planId,
                  planName: item.name,
                  kind,
                  title,
                  students,
                  work: selectedWork,
                });
              return (
                <Stack
                  key={item.planId}
                  direction={{ xs: "column", md: "row" }}
                  sx={{
                    gap: 2,
                    alignItems: { md: "center" },
                    justifyContent: "space-between",
                    borderBottom: 1,
                    borderColor: "divider",
                    pb: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.status === "active"
                        ? "Active"
                        : item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    sx={{ gap: 2, flexWrap: "wrap", alignItems: "center" }}
                  >
                    <Button onClick={() => open("students", "Active students")}>
                      Active Students ({item.activeStudents})
                    </Button>
                    <Button
                      disabled={invalid}
                      onClick={() => open("due", "Work due", dueWork)}
                    >
                      Work due ({invalid ? "—" : dueWork.length})
                    </Button>
                    <Button
                      onClick={() => open("overdue", "Overdue work", lateWork)}
                    >
                      Overdue ({lateWork.length})
                    </Button>
                    <Button
                      variant="outlined"
                      href={`/coaching/plans/${item.planId}`}
                    >
                      Open plan
                    </Button>
                  </Stack>
                </Stack>
              );
            })
          )}
          {planPages > 1 ? (
            <Stack
              direction="row"
              sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
            >
              <Button
                disabled={planPage <= 1}
                onClick={() =>
                  change({ plansPage: String(planPage - 1) }, false)
                }
              >
                Previous plans
              </Button>
              <Typography variant="body2">
                Page {planPage} of {planPages}
              </Typography>
              <Button
                disabled={planPage >= planPages}
                onClick={() =>
                  change({ plansPage: String(planPage + 1) }, false)
                }
              >
                Next plans
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DashboardPanel>
      <CoachingPlanSummaryDrawer
        selection={planSummary}
        nowUtc={nowUtc}
        onClose={() => setPlanSummary(null)}
        returnTo={currentReturn}
      />
      <DashboardPanel title="Upcoming work">
        <Stack spacing={2}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            {(
              [
                { value: "upcoming", label: "Selected period" },
                { value: "overdue", label: `Overdue (${overdue.length})` },
                { value: "all", label: "All outstanding" },
              ] as const
            ).map((item) => (
              <Button
                key={item.value}
                variant={scope === item.value ? "contained" : "outlined"}
                aria-pressed={scope === item.value}
                onClick={() =>
                  change({ scope: item.value === "upcoming" ? "" : item.value })
                }
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {rows.length} scheduled or submitted{" "}
            {rows.length === 1 ? "item matches" : "items match"} this view.
          </Typography>
          <IndependentCoachingWorkList
            work={rows.slice((page - 1) * 20, page * 20)}
            nowUtc={nowUtc}
            returnTo={currentReturn}
          />
          {pages > 1 ? (
            <Stack
              direction="row"
              sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
            >
              <Button
                disabled={page <= 1}
                onClick={() => change({ workPage: String(page - 1) }, false)}
              >
                Previous work
              </Button>
              <Typography variant="body2">
                Page {page} of {pages} ({rows.length} items)
              </Typography>
              <Button
                disabled={page >= pages}
                onClick={() => change({ workPage: String(page + 1) }, false)}
              >
                Next work
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DashboardPanel>
    </Stack>
  );
}
