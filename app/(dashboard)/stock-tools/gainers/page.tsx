import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Typography from "@mui/material/Typography";

import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { findGainerAppearances, readGainerArchive } from "@/src/modules/stock-gainers/server/archive";

import { GainerFilterForm, type GainerFilters, type GainerPeriod } from "./gainer-filters";

export const metadata: Metadata = {
  title: "Stock Gainers | TradersLink Platform",
  robots: { index: false, follow: false },
};

const route = "/stock-tools/gainers";
const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "2-digit", timeZone: "UTC" });
const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dollarVolume = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
});

type RankedRow = {
  rank: number;
  symbol: string;
  close: number;
  sessionHigh?: number;
  gain: number;
  dollarVolume?: number | null;
  day: string;
};

function Rankings({ rows, sessionHigh }: {
  rows: RankedRow[];
  sessionHigh: boolean;
}) {
  return (
    <Box sx={{
      overflowX: "auto",
      mt: 2,
      "& table": { width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" },
      "& th, & td": { borderBottom: 1, borderColor: "divider", p: 1, textAlign: "left" },
    }}>
      <table>
        <thead><tr>
          <th scope="col">
            Date
            <Box component="small" sx={{ display: "block", fontSize: "0.72em", fontWeight: 400, whiteSpace: "nowrap" }}>
              MM/DD/YY
            </Box>
          </th>
          <th scope="col">Rank</th><th scope="col">Ticker</th>
          {sessionHigh && <th scope="col">High</th>}
          <th scope="col">Close</th><th scope="col">{sessionHigh ? "Max gain" : "Gain"}</th><th scope="col">
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
              $Vol
              <Tooltip describeChild title="Estimated dollars traded (share volume × volume-weighted average price). This total can include postmarket trades.">
                <IconButton size="small" aria-label="About dollar volume">
                  <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </th>
        </tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.day ?? ""}:${row.rank}`}>
              <Box component="td" sx={{ whiteSpace: "nowrap" }}>{shortDate.format(new Date(row.day))}</Box>
              <td>{row.rank}</td><th scope="row">{row.symbol}</th>
              {sessionHigh && <td>{row.sessionHigh == null ? "—" : price.format(row.sessionHigh)}</td>}
              <td>{price.format(row.close)}</td>
              <Box component="td" sx={{ color: "success.main" }}>+{row.gain.toFixed(2)}%</Box>
              <td>{row.dollarVolume == null ? "—" : dollarVolume.format(row.dollarVolume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function dateWithin(value: string | undefined, min: string, max: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value &&
    min <= value && value <= max;
}

export default async function StockGainersPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireTraderLinkPlatformPageIdentity();
  const archive = await readGainerArchive();
  const days = Object.keys(archive?.sessions ?? {}).sort().reverse();
  if (!archive || !days.length) {
    return (
      <DashboardPage>
        <Typography component="h1" variant="h1">Stock Gainers</Typography>
        <Alert severity="info">Stock gainers are unavailable.</Alert>
      </DashboardPage>
    );
  }

  const params = await searchParams;
  const query = (name: string) => typeof params[name] === "string" ? params[name] : undefined;
  const latest = days[0];
  const earliest = days[days.length - 1];
  const months = [...new Set(days.map((day) => day.slice(0, 7)))];
  const years = [...new Set(days.map((day) => day.slice(0, 4)))];
  const requestedPeriod = query("period");
  const period: GainerPeriod = requestedPeriod === "month" || requestedPeriod === "year" || requestedPeriod === "range"
    ? requestedPeriod : "day";
  const boundedDate = (value: string | undefined, fallback: string) =>
    value && dateWithin(value, earliest, latest) ? value : fallback;
  const requestedCutoff = Number(query("cutoff"));
  const requestedVolume = Number(query("volume"));
  const requestedSort = query("sort");
  const filters: GainerFilters = {
    period,
    day: boundedDate(query("day"), latest),
    month: months.find((month) => month === query("month")) ?? months[0],
    year: years.find((year) => year === query("year")) ?? years[0],
    from: boundedDate(query("from"), earliest),
    to: boundedDate(query("to"), latest),
    ticker: (query("ticker") ?? "").trim().toUpperCase().slice(0, 16),
    cutoff: Number.isInteger(requestedCutoff) && requestedCutoff >= 1 && requestedCutoff <= 10 ? requestedCutoff : 10,
    volume: [0, 1_000_000, 5_000_000, 10_000_000, 50_000_000].includes(requestedVolume) ? requestedVolume : 0,
    sort: requestedSort === "gain" || requestedSort === "volume" ? requestedSort : "date",
  };
  const invalidRange = period === "range" && filters.from > filters.to;
  const matchingDays = days.filter((day) => {
    if (period === "day") return day === filters.day;
    if (period === "month") return day.startsWith(filters.month);
    if (period === "year") return day.startsWith(filters.year);
    return filters.from <= day && day <= filters.to;
  });
  const { rows, ambiguous } = findGainerAppearances(
    archive, days, filters.ticker, matchingDays.at(-1) ?? "9999", matchingDays[0] ?? "0000",
    filters.cutoff, filters.volume,
  );
  const lastAppearance = rows[0]?.day;
  const bestRank = rows.reduce((best, row) => Math.min(best, row.rank), 10);
  if (filters.sort === "gain") rows.sort((a, b) => b.gain - a.gain);
  if (filters.sort === "volume") rows.sort((a, b) => (b.dollarVolume ?? 0) - (a.dollarVolume ?? 0));
  const pageSize = 25;
  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const requestedPage = Number(query("page"));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(lastPage, Math.max(1, requestedPage)) : 1;
  const start = (page - 1) * pageSize;
  const pageHref = (value: number) => `${route}?${new URLSearchParams({
    ...filters, cutoff: String(filters.cutoff), volume: String(filters.volume), page: String(value),
  })}`;
  const sessionHigh = archive.rankingMethod === "session-high";

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Stock Gainers</Typography>
      <DashboardPanel title="Find top gainers">
        <Typography component="p" variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: "68ch" }}>
          See the top 10 U.S. stock gainers after each market close, including small-cap and micro-cap movers. Browse historical rankings and find repeat movers by ticker for your day trading watchlist.
        </Typography>
        {sessionHigh && (
          <Typography component="p" variant="caption" sx={{ display: "block", fontStyle: "italic", mb: 2 }}>
            Max gain is the percentage increase from the previous regular-session close to the session high.
            The session high includes premarket and regular-session trading. Postmarket prices are excluded.
          </Typography>
        )}
        <GainerFilterForm key={JSON.stringify(filters)} filters={filters} earliest={earliest} latest={latest} years={years} />
        {invalidRange && <Alert severity="warning" sx={{ mt: 2 }}>Choose an end date on or after the start date.</Alert>}
        {ambiguous && !invalidRange && <Alert severity="info" sx={{ mt: 2 }}>Multiple securities used this ticker.</Alert>}
        {!rows.length && !ambiguous && !invalidRange && <Alert severity="info" sx={{ mt: 2 }}>No matching results.</Alert>}
        {filters.ticker && lastAppearance && (
          <Box component="dl" sx={{ display: "flex", flexWrap: "wrap", gap: 2, "& dd": { m: 0, fontWeight: 700 } }}>
            <div><dt>Appearances</dt><dd>{rows.length}</dd></div>
            <div><dt>Best rank</dt><dd>#{bestRank}</dd></div>
            <div><dt>Last appearance</dt><dd>{dateLabel.format(new Date(lastAppearance))}</dd></div>
          </Box>
        )}
        {rows.length > 0 && <Rankings sessionHigh={sessionHigh} rows={rows.slice(start, start + pageSize)} />}
        {lastPage > 1 && (
          <Box component="nav" aria-label="Results pages" sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mt: 2 }}>
            {page > 1 && <DashboardSecondaryAction href={pageHref(page - 1)}>Previous</DashboardSecondaryAction>}
            <Typography component="span">{start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}</Typography>
            {page < lastPage && <DashboardSecondaryAction href={pageHref(page + 1)}>Next</DashboardSecondaryAction>}
          </Box>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}
