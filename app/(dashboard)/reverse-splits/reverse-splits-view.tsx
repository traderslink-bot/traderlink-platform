"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPanel, DashboardPrimaryAction, DashboardSecondaryAction } from "@/app/dashboard-template";
import { reverseSplitCheckedAt, reverseSplitClose, reverseSplitDate, reverseSplitQuantity, type ReverseSplitDashboard, type ReverseSplitRow } from "@/src/modules/news/contracts/reverse-split-dashboard-contracts";

const filters = [{ value: "all", label: "All" }, { value: "approved", label: "Approved" }, { value: "announced", label: "Announced" }, { value: "history", label: "History" }];

function Status({ item }: { item: ReverseSplitRow }) {
  return <Chip size="small" variant="outlined" label={item.status} color={item.status === "Approved" ? "warning" : item.status === "Announced" ? "info" : "default"} />;
}

function Source({ item }: { item: ReverseSplitRow }) {
  return <Stack spacing={0.5}>
    <Typography component="a" href={item.sourceUrl} target="_blank" rel="noopener noreferrer" color="primary" variant="body2" sx={{ textDecoration: "underline", width: "fit-content" }}>
      {item.sourceKind === "sec" ? "SEC filing" : "Nasdaq notice"}<Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}> (opens in a new tab)</Box>
    </Typography>
    <Typography variant="caption" color="text.secondary">{reverseSplitDate(item.sourcePublishedDate)}</Typography>
  </Stack>;
}

function Ticker({ item }: { item: ReverseSplitRow }) {
  return <Stack spacing={0.5}>
    <Typography component="span" sx={{ fontWeight: 800 }}>{item.ticker}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 190, overflowWrap: "anywhere" }}>{item.company}</Typography>
  </Stack>;
}

function MobileRow({ item }: { item: ReverseSplitRow }) {
  const facts = [
    ["Approved ratio / range", item.approvedRatio ?? "—"],
    ["Shareholder approval", reverseSplitDate(item.approvalDate)],
    ["Final ratio", item.ratio ? `1-for-${item.ratio}` : "—"],
    ["Trading date", reverseSplitDate(item.tradingDate)],
    ["Float", reverseSplitQuantity(item.float)],
    ["Float retrieved", reverseSplitCheckedAt(item.floatRetrievedAt)],
    ["Est. post-split float*", reverseSplitQuantity(item.estimatedPostSplitFloat)],
    ["Regular-session close", reverseSplitClose(item.close)],
    ["Close date", reverseSplitDate(item.closeDate)],
  ];
  return <Box component="article" aria-label={`${item.ticker} reverse split`} sx={{ py: 2 }}>
    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}><Ticker item={item} /><Status item={item} /></Stack>
    <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 1, m: 0 }}>
      {facts.map(([label, value]) => <Box key={label}>
        <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere" }}>{value}</Typography>
      </Box>)}
    </Box>
    <Box sx={{ mt: 2 }}><Source item={item} /></Box>
  </Box>;
}

export function ReverseSplitsView({ data }: { data: ReverseSplitDashboard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canShowList = data.coverage.state === "ready" || data.coverage.state === "partial";
  function pageHref(page: number): string {
    const query = new URLSearchParams({ status: data.filter, page: String(page) });
    if (data.ticker) query.set("ticker", data.ticker);
    return `/reverse-splits?${query}`;
  }
  return <Stack spacing={2} aria-busy={pending}>
    <DashboardPanel>
      <Stack component="form" action="/reverse-splits" method="get" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }} key={`${data.filter}:${data.ticker}`}>
        <TextField name="ticker" label="Ticker" defaultValue={data.ticker} size="small" slotProps={{ htmlInput: { maxLength: 4, autoCapitalize: "characters", spellCheck: false } }} sx={{ minWidth: 140 }} />
        <TextField select name="status" label="Status" defaultValue={data.filter} size="small" sx={{ minWidth: 160 }}>
          {filters.map((filter) => <MenuItem key={filter.value} value={filter.value}>{filter.label}</MenuItem>)}
        </TextField>
        <DashboardPrimaryAction type="submit">Apply</DashboardPrimaryAction>
        <DashboardSecondaryAction component={Link} href="/reverse-splits">Clear</DashboardSecondaryAction>
        <DashboardSecondaryAction type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Refresh</DashboardSecondaryAction>
      </Stack>
    </DashboardPanel>
    {data.coverage.note ? <Alert severity={data.coverage.state === "partial" ? "warning" : "info"}>{data.coverage.note}</Alert> : null}
    {canShowList ? <DashboardPanel>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography variant="body2" aria-live="polite">{data.total.toLocaleString("en-US")} {data.total === 1 ? "entry" : "entries"}</Typography>
        {data.coverage.checkedAt ? <Typography variant="caption" color="text.secondary">Sources checked {reverseSplitCheckedAt(data.coverage.checkedAt)}</Typography> : null}
      </Stack>
      {!data.items.length ? <Typography color="text.secondary" sx={{ py: 3 }}>No verified entries match these filters.</Typography> : <>
        <Box sx={{ display: { xs: "block", md: "none" } }}><Stack divider={<Divider />}>{data.items.map((item) => <MobileRow key={item.id} item={item} />)}</Stack></Box>
        <TableContainer sx={{ display: { xs: "none", md: "block" }, maxWidth: "100%" }} tabIndex={0} role="region" aria-label="Scrollable reverse-split table">
          <Table size="small" aria-label="Reverse splits" sx={{ minWidth: 1150, "& td, & th": { verticalAlign: "top", py: 1.5 }, "& th": { color: "text.secondary", fontWeight: 700 } }}>
            <TableHead><TableRow>{["Ticker", "Status", "Approved ratio / range", "Final ratio", "Trading date", "Float", "Est. post-split float*", "Regular-session close", "Source"].map((title) => <TableCell key={title} scope="col">{title}</TableCell>)}</TableRow></TableHead>
            <TableBody>{data.items.map((item) => <TableRow hover key={item.id}>
              <TableCell><Ticker item={item} /></TableCell><TableCell><Status item={item} /></TableCell>
              <TableCell>{item.approvedRatio ?? "—"}{item.approvalDate ? <Typography sx={{ display: "block" }} variant="caption" color="text.secondary">Approved {reverseSplitDate(item.approvalDate)}</Typography> : null}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{item.ratio ? `1-for-${item.ratio}` : "—"}</TableCell>
              <TableCell>{reverseSplitDate(item.tradingDate)}</TableCell>
              <TableCell>{reverseSplitQuantity(item.float)}{item.floatRetrievedAt ? <Typography sx={{ display: "block" }} variant="caption" color="text.secondary">Retrieved {reverseSplitCheckedAt(item.floatRetrievedAt)}</Typography> : null}</TableCell>
              <TableCell>{reverseSplitQuantity(item.estimatedPostSplitFloat)}</TableCell>
              <TableCell>{reverseSplitClose(item.close)}<Typography variant="caption" sx={{ display: "block" }} color="text.secondary">{reverseSplitDate(item.closeDate)}</Typography></TableCell>
              <TableCell><Source item={item} /></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>
      </>}
      {data.pageCount > 1 ? <Pagination aria-label="Reverse-split pages" count={data.pageCount} page={data.page} disabled={pending} onChange={(_, page) => startTransition(() => router.push(pageHref(page)))} sx={{ mt: 2, "& ul": { justifyContent: "center" } }} /> : null}
    </DashboardPanel> : null}
    <Typography variant="caption" color="text.secondary">
      Float is the provider-reported estimate, not shares outstanding. *Estimated post-split float assumes the reported float is still pre-split; provider updates can lag. Closing prices are dated regular-session prices, not extended-hours quotes. A past announced date does not confirm that trading resumed. Missing values appear as a dash.
    </Typography>
  </Stack>;
}
