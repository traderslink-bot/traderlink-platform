import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage, DashboardPanel, DashboardPrimaryAction } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { findGainerAppearances, readGainerArchive } from "@/src/modules/stock-gainers/server/archive";

export const metadata: Metadata = {
  title: "Stock Gainers | TradersLink Platform",
  robots: { index: false, follow: false },
};

const route = "/stock-tools/gainers";
const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dollarVolume = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
});

const controls = {
  alignItems: "end",
  display: "flex",
  flexWrap: "wrap",
  gap: 1.5,
  "& label": { display: "grid", gap: 0.5, fontSize: 14 },
  "& input, & select": {
    border: 1,
    borderColor: "divider",
    borderRadius: 1,
    minHeight: 40,
    maxWidth: "100%",
    px: 1,
    font: "inherit",
    color: "text.primary",
    bgcolor: "background.paper",
  },
} as const;

type RankedRow = {
  rank: number;
  symbol: string;
  close: number;
  gain: number;
  dollarVolume?: number | null;
  day?: string;
};

function Rankings({ rows, showDate = false }: { rows: RankedRow[]; showDate?: boolean }) {
  return (
    <Box sx={{
      overflowX: "auto",
      mt: 2,
      "& table": { width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" },
      "& th, & td": { borderBottom: 1, borderColor: "divider", p: 1, textAlign: "left" },
    }}>
      <table>
        <thead><tr>
          {showDate && <th scope="col">Date</th>}
          <th scope="col">Rank</th><th scope="col">Ticker</th>
          <th scope="col">Close</th><th scope="col">Gain</th><th scope="col">Dollar volume</th>
        </tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.day ?? ""}:${row.rank}`}>
              {showDate && row.day && <td><a href={`${route}?day=${row.day}`}>{row.day}</a></td>}
              <td>{row.rank}</td><th scope="row">{row.symbol}</th>
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
  const day = days.find((entry) => entry === query("day")) ?? latest;
  const fromParam = query("from");
  const toParam = query("to");
  const from = fromParam && dateWithin(fromParam, earliest, latest) ? fromParam : earliest;
  const to = toParam && dateWithin(toParam, earliest, latest) ? toParam : latest;
  const symbol = (query("ticker") ?? "").trim().toUpperCase().slice(0, 16);
  const requestedCutoff = Number(query("cutoff"));
  const cutoff = Number.isInteger(requestedCutoff) && requestedCutoff >= 1 && requestedCutoff <= 10
    ? requestedCutoff : 10;
  const matches = symbol ? findGainerAppearances(archive, days, symbol, from, to, cutoff) : null;
  const firstMatch = matches?.rows[0];

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Stock Gainers</Typography>
      <DashboardPanel title="Daily top 10">
        <Typography component="p" variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: "68ch" }}>
          See the top 10 U.S. stock gainers after each market close, including small-cap and micro-cap movers. Browse historical rankings and find repeat movers by ticker for your day trading watchlist.
        </Typography>
        <Box component="form" action={route} method="get" sx={controls}>
          <label>Trading date
            <select name="day" defaultValue={day}>
              {days.map((entry) => <option key={entry} value={entry}>{dateLabel.format(new Date(entry))}</option>)}
            </select>
          </label>
          {symbol && <input type="hidden" name="ticker" value={symbol} />}
          {symbol && <input type="hidden" name="from" value={from} />}
          {symbol && <input type="hidden" name="to" value={to} />}
          {symbol && <input type="hidden" name="cutoff" value={cutoff} />}
          <DashboardPrimaryAction type="submit">Show date</DashboardPrimaryAction>
        </Box>
        <Rankings rows={archive.sessions[day].rows.map((row, index) => ({ ...row, rank: index + 1 }))} />
      </DashboardPanel>
      <DashboardPanel title="Ticker appearances">
        {firstMatch && matches && (
          <Box component="dl" sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 0, "& dd": { m: 0, fontWeight: 700 } }}>
            <div><dt>Appearances</dt><dd>{matches.rows.length}</dd></div>
            <div><dt>Best rank</dt><dd>#{Math.min(...matches.rows.map((row) => row.rank))}</dd></div>
            <div><dt>Last appearance</dt><dd>{dateLabel.format(new Date(firstMatch.day))}</dd></div>
          </Box>
        )}
        {symbol && from > to && <Alert severity="warning">Choose an end date on or after the start date.</Alert>}
        {matches?.ambiguous && <Alert severity="info">Multiple securities used this ticker.</Alert>}
        {matches && from <= to && !matches.ambiguous && !firstMatch && <Alert severity="info">No appearances found.</Alert>}
        <Box component="form" action={route} method="get" sx={controls}>
          <input type="hidden" name="day" value={day} />
          <label>Ticker<input name="ticker" defaultValue={symbol} maxLength={16} required /></label>
          <label>From<input type="date" name="from" min={earliest} max={latest} defaultValue={from} /></label>
          <label>To<input type="date" name="to" min={earliest} max={latest} defaultValue={to} /></label>
          <label>Rank cutoff
            <select name="cutoff" defaultValue={cutoff}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((rank) => <option key={rank} value={rank}>Top {rank}</option>)}
            </select>
          </label>
          <DashboardPrimaryAction type="submit">Find appearances</DashboardPrimaryAction>
        </Box>
        {firstMatch && matches && <Rankings rows={matches.rows} showDate />}
      </DashboardPanel>
    </DashboardPage>
  );
}
