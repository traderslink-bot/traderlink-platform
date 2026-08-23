import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import Link from "next/link";

import type {
  CommunityWatchlistDetail,
  CommunityWatchlistSummary,
} from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPanel } from "../../../dashboard-template";

function tags(values: readonly string[]) {
  return values.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />);
}

function postedLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Posted"
    : `Posted ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date)} ET`;
}

export function CommunityWatchlistSummaryCard({ item }: { item: CommunityWatchlistSummary }) {
  return (
    <DashboardPanel
      action={<Chip color={item.status === "published" ? "success" : "default"} label={item.status === "published" ? "Published" : "Draft"} size="small" variant="outlined" />}
      title={item.title}
    >
      <Stack spacing={1.5}>
        {item.description ? <Typography color="text.secondary" variant="body2">{item.description}</Typography> : null}
        {item.tags.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>{tags(item.tags)}</Stack> : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
          <Typography color="text.secondary" variant="caption">@{item.authorHandle} · {item.symbolCount} {item.symbolCount === 1 ? "symbol" : "symbols"}</Typography>
          {item.status === "published" ? <Link href={item.href} style={{ textDecoration: "none" }}><Button component="span" endIcon={<LaunchRoundedIcon />} size="small">Open watchlist</Button></Link> : null}
        </Stack>
      </Stack>
    </DashboardPanel>
  );
}

export function CommunityWatchlistTickerCards({ detail }: { detail: CommunityWatchlistDetail }) {
  return (
    <Stack spacing={1.25}>
      {detail.tickers.map((ticker) => {
        const extraDetails = [ticker.whyWatching, ticker.plan, ticker.personalTarget, ticker.catalyst, ticker.postedReferencePrice].filter(Boolean).length;
        return (
          <Accordion disableGutters elevation={0} key={ticker.symbol} sx={{ border: 1, borderColor: "divider", borderRadius: "10px !important", overflow: "hidden", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ alignItems: "flex-start", minHeight: 104, px: { xs: 1.5, sm: 2 } }}>
              <Stack spacing={1} sx={{ minWidth: 0, py: 0.75, pr: 1, width: "100%" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography component="h3" sx={{ fontSize: "1.08rem", fontWeight: 820 }}>{ticker.symbol}</Typography>
                  <Typography color="text.secondary" variant="caption">{ticker.postedReferencePrice ? `Posted reference: ${ticker.postedReferencePrice}` : "Research added"}</Typography>
                </Stack>
                {ticker.tags.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>{tags(ticker.tags)}</Stack> : null}
                {ticker.whyWatching ? <Typography color="text.secondary" variant="body2">{ticker.whyWatching}</Typography> : null}
                <Typography color="text.secondary" variant="caption">
                  {postedLabel(ticker.postedAtUtc)} · {extraDetails ? `${extraDetails} detail${extraDetails === 1 ? "" : "s"}` : "Open for research details"}{ticker.catalyst ? ` · Catalyst ${ticker.catalystDate ?? "added"}` : ""}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: 1, borderColor: "divider", px: { xs: 1.5, sm: 2 }, py: 2 }}>
              <Stack spacing={1.75}>
                {ticker.whyWatching ? <div><Typography color="text.secondary" variant="caption">Why I am watching</Typography><Typography variant="body2">{ticker.whyWatching}</Typography></div> : null}
                {ticker.plan ? <div><Typography color="text.secondary" variant="caption">My plan</Typography><Typography variant="body2">{ticker.plan}</Typography></div> : null}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.25, sm: 4 }}>
                  {ticker.personalTarget ? <div><Typography color="text.secondary" variant="caption">Personal target</Typography><Typography sx={{ fontWeight: 760 }} variant="body2">{ticker.personalTarget}</Typography></div> : null}
                  {ticker.catalyst ? <div><Typography color="text.secondary" variant="caption">Upcoming catalyst</Typography><Typography sx={{ fontWeight: 760 }} variant="body2">{ticker.catalyst}{ticker.catalystDate ? ` · ${ticker.catalystDate}` : ""}</Typography></div> : null}
                  {ticker.postedReferencePrice ? <div><Typography color="text.secondary" variant="caption">Posted reference</Typography><Typography sx={{ fontWeight: 760 }} variant="body2">{ticker.postedReferencePrice}</Typography></div> : null}
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
