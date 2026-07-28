import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ViewColumnRoundedIcon from "@mui/icons-material/ViewColumnRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "./dashboard-template";

const emptyMetric = (label: string, caption: string) => ({
  label,
  caption,
  value: "—",
});

const commonAnalyticsMetrics = [
  emptyMetric("Net realized P/L", "Completed trades"),
  emptyMetric("Win rate", "Selected period"),
  emptyMetric("Expectancy", "Per round trip"),
  emptyMetric("Profit factor", "Gross wins ÷ losses"),
  emptyMetric("Round trips", "Selected period"),
  emptyMetric("Trading days", "Selected period"),
] as const;

function ScopeToolbar({ savedViews = false }: { savedViews?: boolean }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
      }}
    >
      <DashboardDataScopeChip />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {savedViews ? (
          <Button disabled startIcon={<SaveRoundedIcon />} variant="outlined">
            Saved views
          </Button>
        ) : null}
        <Button disabled startIcon={<CalendarMonthRoundedIcon />} variant="outlined">
          All available history
        </Button>
        <Button disabled startIcon={<FilterAltRoundedIcon />} variant="outlined">
          Filters
        </Button>
      </Stack>
    </Stack>
  );
}

export function AnalyticsPageFoundation({
  chartTitle,
  metricLabels = commonAnalyticsMetrics,
  supportingTitle,
}: {
  chartTitle: string;
  metricLabels?: readonly Readonly<{
    label: string;
    caption: string;
    value: string;
  }>[];
  supportingTitle: string;
}) {
  return (
    <DashboardPage>
      <ScopeToolbar savedViews />
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        {metricLabels.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            xl: "minmax(0, 1.75fr) minmax(320px, 0.75fr)",
          },
        }}
      >
        <DashboardPanel title={chartTitle}>
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Import trades"
            description="This view will render only verified v3 analytics for the selected scope. No legacy totals or browser calculations are substituted."
          />
        </DashboardPanel>
        <DashboardPanel title={supportingTitle}>
          <DashboardUnavailableState
            compact
            description="Supporting groups and exact sample counts will appear when verified execution analytics are available."
          />
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}

export function TradeTableFoundation({
  columns,
  filters,
  unavailableDescription,
}: {
  columns: readonly string[];
  filters: readonly string[];
  unavailableDescription: string;
}) {
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", lg: "center" } }}
      >
        <TextField
          disabled
          placeholder="Search ticker"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { lg: 260 } }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexGrow: 1 }}
        >
          {filters.map((filter) => (
            <Button disabled key={filter} startIcon={<FilterAltRoundedIcon />} variant="outlined">
              {filter}
            </Button>
          ))}
        </Stack>
        <Button disabled startIcon={<SaveRoundedIcon />} variant="outlined">
          Saved views
        </Button>
        <Button disabled startIcon={<ViewColumnRoundedIcon />} variant="outlined">
          Columns
        </Button>
      </Stack>
      <TableContainer
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Table aria-label="Trade data">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ p: 2 }}>
                <DashboardUnavailableState
                  actionHref="/imports"
                  actionLabel="Import trades"
                  compact
                  description={unavailableDescription}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardPage>
  );
}

export function DaySessionsFoundation() {
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", md: "center" } }}
      >
        <ButtonGroup aria-label="Day session display" size="small">
          <Button variant="contained">Calendar</Button>
          <Button variant="outlined">List</Button>
        </ButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        <Button disabled startIcon={<CalendarMonthRoundedIcon />} variant="outlined">
          Date range
        </Button>
        <Button disabled startIcon={<FilterAltRoundedIcon />} variant="outlined">
          P/L and session filters
        </Button>
        <Button disabled startIcon={<SaveRoundedIcon />} variant="outlined">
          Saved views
        </Button>
      </Stack>
      <DashboardPanel title="Trading days">
        <DashboardUnavailableState
          actionHref="/imports"
          actionLabel="Add trading history"
          description="Calendar and list views will use the same verified day-session data. Selecting a day will open its P/L, note, ticker cards, and round trips."
        />
      </DashboardPanel>
    </DashboardPage>
  );
}

export function AnalyticsLabFoundation() {
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", lg: "center" } }}
      >
        <FormControl disabled size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="saved-analysis-view-label">Saved view</InputLabel>
          <Select
            label="Saved view"
            labelId="saved-analysis-view-label"
            value="new-analysis"
          >
            <MenuItem value="new-analysis">New analysis</MenuItem>
          </Select>
        </FormControl>
        <Button disabled startIcon={<SaveRoundedIcon />} variant="outlined">
          Save as
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button disabled startIcon={<CalendarMonthRoundedIcon />} variant="outlined">
          All available history
        </Button>
        <Button disabled startIcon={<TuneRoundedIcon />} variant="outlined">
          Reset
        </Button>
        <Button disabled variant="contained">
          Run analysis
        </Button>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            xl: "340px minmax(0, 1fr)",
          },
        }}
      >
        <DashboardPanel title="Build an analysis">
          <Stack spacing={1.5}>
            {[
              ["Starting point", "Performance over time"],
              ["Metric", "Net realized P/L"],
              ["Break down by", "Month"],
              ["Second breakdown", "None"],
              ["Compare with", "No comparison"],
              ["Visualization", "Line chart"],
            ].map(([label, value]) => (
              <TextField
                disabled
                key={label}
                label={label}
                size="small"
                value={value}
              />
            ))}
          </Stack>
        </DashboardPanel>
        <DashboardPanel
          action={
            <ButtonGroup aria-label="Analytics Lab result view" size="small">
              <Button variant="contained">Chart</Button>
              <Button variant="outlined">Table</Button>
            </ButtonGroup>
          }
          title="Analysis results"
        >
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Add verified data"
            description="Analytics Lab will enable only metrics, groupings, comparisons, and charts supported by the current v3 authority. Every result will retain its sample size and drill-down."
          />
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}
