"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import Decimal from "decimal.js";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { DaySessionTradeAnalyzer } from "./[sessionDate]/day-session-types";
import { analyzerProgressMessage } from "./analyzer-progress-messages";
import { buildWrittenTradeReview, type WrittenReviewFill } from "./analyzer-written-review-model";
import { tradeSummaryPoints } from "./analyzer-trade-summary";

function Help({ label, text }: { label: string; text: string }) {
  return <Tooltip arrow describeChild enterTouchDelay={0} title={text}><IconButton aria-label={`About ${label}`} size="small" sx={{ color: "text.secondary", ml: 0.25 }}><HelpOutlineRoundedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>;
}
function Heading({ title, help }: { title: string; help: string }) {
  return <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 800 }}>{title}<Help label={title} text={help} /></Typography>;
}
function pnlColor(value: string) { return new Decimal(value).toDecimalPlaces(2).isZero() ? "text.primary" : value.startsWith("-") ? "error.main" : "success.main"; }
function amount(value: string, currency: string) {
  const symbol = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find(part => part.type === "currency")?.value ?? currency;
  const number = new Decimal(value).toDecimalPlaces(2);
  return `${number.isNegative() && !number.isZero() ? "-" : ""}${symbol}${formatJournalAnalyticsDecimal(number.abs().toFixed(2))}`;
}

export function ExecutionPositionDetails({ fill, currency }: { fill: WrittenReviewFill; currency: string }) {
  return <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
    <Typography variant="caption" sx={{ fontWeight: 700 }}>{fill.label}</Typography>
    <Typography variant="caption" color="text.secondary">· {formatJournalAnalyticsDecimal(fill.remaining)} shares remaining</Typography>
    {fill.grossPnl !== null ? <Typography variant="caption" sx={{ color: pnlColor(fill.grossPnl), fontWeight: 700 }}>· Gross exit P/L: {amount(fill.grossPnl, currency)}<Help label="Gross exit P/L" text="Profit or loss from this exit only, before fees. Calculated from the shares sold or covered and their average entry cost immediately before this exit—not the final P/L of the whole trade." /></Typography> : null}
  </Stack>;
}

export function WrittenTradeAnalysis({ analysis, direction, currency, timezone, children, timeframe = "1m", hideExecutionDetails = false }: {
  analysis: DaySessionTradeAnalyzer; direction: "long" | "short"; currency: string; timezone: string; children?: ReactNode; timeframe?: "1m" | "5m"; hideExecutionDetails?: boolean;
}) {
  const review = useMemo(() => buildWrittenTradeReview(analysis, direction), [analysis, direction]);
  const count = analysis.reviewContext?.analyzedTradeCount;
  const time = (seconds: number) => new Date(seconds * 1000).toLocaleString("en-US", { timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const path = review?.path;
  const final = review ? new Decimal(review.finalPnl).toDecimalPlaces(2) : null;
  const finish = final?.isZero() ? "finished at breakeven" : final?.isNegative() ? "finished red" : "finished green";
  const longest = path?.bestProfitOpportunityIndex == null ? null : path.profitOpportunities[path.bestProfitOpportunityIndex];
  return <Stack spacing={2} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
    <Typography variant="body2" color="text.secondary">This analysis looks at one trade. The real value comes from collecting more trades and reviewing their combined data in the analysis pages.</Typography>
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 1.5, md: 2 }, bgcolor: "action.hover" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 850 }}>Your trading has patterns. Find yours.</Typography>
        {count != null ? <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{count} analyzed {count === 1 ? "trade" : "trades"}<Help label="analyzed trade count" text="Your current analyzed day trades in this account. Each saved trade counts once, even when it contains several round trips. Analyzing the same trade again does not increase this count. 100 is a collection goal, not a guarantee that a pattern is reliable." /></Typography> : null}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{count == null ? "One trade tells a story. Keep analyzing to build the bigger picture of how you trade." : analyzerProgressMessage(count)}</Typography>
      {count != null && count < 100 ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Building toward 100 analyzed trades</Typography> : null}
      {count != null && count < 100 ? <LinearProgress aria-label={`${count} of 100 analyzed trades`} value={Math.min(100, Math.max(0, count))} variant="determinate" sx={{ mt: 1.25, height: 5, borderRadius: 3 }} /> : null}
      {count != null && count >= 100 ? <Button href="/analytics/trade-analyzer/day" size="small" sx={{ mt: 0.75, px: 0 }}>View your analysis pages</Button> : null}
    </Box>
    <Box><Heading title="Trade summary" help={`The key entry, exit and green-to-red findings for this saved trade. ${timeframe === "5m" ? "EMA 9 uses the last completed 5-minute candle before the entry." : "EMA 9 uses the saved one-minute candle containing the entry, including that minute's completed data."} VWAP is session-based through the execution minute. Profit-path timing and peak opportunity retain one-minute closes and exact executions when you change chart timeframe. Peak opportunity includes realized P/L plus the value of shares still held. Profitable-exit amounts are gross, before losing exits and fees; final Trade P/L combines all exits using your selected basis. Price movement after the final exit is not included.`} />
      <Typography variant="caption" color="text.secondary">{review?.basis === "net" ? "Net P/L · entered fees included" : "Gross P/L · before fees"}</Typography>
      {review && final ? <>
        <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 850, color: pnlColor(review.finalPnl) }}>{final.isZero() ? "Finished at breakeven." : `Finished with a ${amount(final.abs().toFixed(), currency)} ${final.lt(0) ? "loss" : "profit"}.`}</Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.25, display: "grid", gap: 0.65 }}>{tradeSummaryPoints(analysis, review, value => amount(value, currency), timeframe).map(point => <Typography component="li" variant="body2" key={point}>{point}</Typography>)}</Box>
      </> : null}
    </Box>
    {!review ? <Alert severity="info">The saved executions are not complete enough to calculate this trade’s P/L story.</Alert> : <>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        {[
          { label: "Trade P/L", value: review.finalPnl, detail: finish, help: `Your completed trade’s profit or loss from every opening and closing execution in this saved trade. ${review.basis === "net" ? "Entered fees are applied once. Missing fees are not guessed or used to hide the trade." : "Broker fees are not deducted."}` },
          { label: "Peak profit opportunity", value: review.peak, detail: review.peakTime === null ? "No positive P/L" : time(review.peakTime), help: "The highest whole-trade P/L at a saved one-minute candle close or execution price while the trade was active, including profit or loss already realized. Uses shares actually held at each point—not the original position after you scaled out. This is a potential trade outcome, not an extra amount to add to Trade P/L. Candle highs between these points may be higher." },
          { label: "Peak to exit", value: Decimal.max(0, new Decimal(review.peak).minus(review.finalPnl)).toFixed(), detail: "P/L below the peak", help: "Peak profit opportunity minus completed Trade P/L. For example, a $800 peak followed by a $300 loss is a $1,100 difference: the earlier $800 profit plus the $300 loss. This difference is not itself a realized loss." },
        ].map(metric => <Box key={metric.label} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5, minWidth: 0 }}><Heading title={metric.label} help={metric.help} /><Typography variant="h6" sx={{ fontWeight: 850, color: metric.label === "Peak to exit" ? "text.primary" : pnlColor(metric.value) }}>{amount(metric.value, currency)}</Typography><Typography variant="caption" color="text.secondary">{metric.detail}</Typography></Box>)}
      </Box>
      {review.basis === "net" && !review.feesComplete ? <Typography variant="caption" color="text.secondary">Some fees were left blank. Net P/L deducts only the fees entered.<Help label="missing fees" text="A blank fee does not remove your trade. If you do not track fees, choose Gross P/L in Account settings. Entered zero fees remain valid." /></Typography> : null}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: longest ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
        <Box><Heading title="Entries and exits" help="These are the saved executions inside this trade, in time order. A full exit sells or covers the entire position in one execution without an earlier scale-out in that position. A final scale-out closes what remained after earlier partial exits. A later re-entry can still belong to the same saved trade." />
          <Typography variant="body2">{review.entryCount} opening {review.entryCount === 1 ? "execution" : "executions"} · {review.exitCount} closing {review.exitCount === 1 ? "execution" : "executions"}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{review.fills.filter(fill => fill.grossPnl !== null).map(fill => fill.label).filter((label, index, all) => all.indexOf(label) === index).join(" · ")}</Typography>
        </Box>
        <Box><Heading title="Profit path" help="Green means whole-trade P/L above $0; red means below $0. The path uses completed one-minute closes and exact executions while shares were held. A recovery is a return above $0 after turning red; it does not mean the trade stayed green until exit." />
          <Stack spacing={0.5}>
            {path?.status === "unavailable" ? <Typography variant="body2">More saved candle coverage is needed to show the profit path.</Typography> : <>
              <Typography variant="body2">{path?.firstGreenAtUtcSeconds == null ? "The trade did not move into profit at the recorded closes or executions." : `First green: ${time(path.firstGreenAtUtcSeconds)}.`}</Typography>
              {path?.firstRedAtUtcSeconds != null ? <>
                <Typography variant="body2">Before first turning red, profit reached {amount(path.peakPnlDecimal ?? "0", currency)}{path.peakAtUtcSeconds == null ? "" : ` at ${time(path.peakAtUtcSeconds)}`}.</Typography>
                <Typography variant="body2">Turned red: {time(path.firstRedAtUtcSeconds)} · {amount(path.firstRedPnlDecimal ?? "0", currency)}.</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{path.firstRecoveryAtUtcSeconds != null ? `Recovered ${time(path.firstRecoveryAtUtcSeconds)} · ${finish}.` : `Never recovered · ${finish}.`}</Typography>
              </> : path?.firstGreenAtUtcSeconds != null ? <Typography variant="body2">Did not turn red after first becoming profitable · {finish}.</Typography> : null}
            </>}
          </Stack>
        </Box>
      {longest ? <Box><Heading title="Longest profit window" help="The longest uninterrupted run of one-minute closes at or above half of this trade’s highest profitable candle-close P/L. Windows break when a close falls below that level or a minute is missing. Ties use the number of closes, then the higher peak. Duration is from the first qualifying close to the last; a single close has no measured duration. This is separate from the adjustable +20% filter on Scaling Out." />
        <Typography variant="body2">{longest.durationMinutes === 0 ? "One completed close" : `${longest.durationMinutes} minute${longest.durationMinutes === 1 ? "" : "s"}`} · {time(longest.startedAtUtcSeconds)}–{time(longest.endedAtUtcSeconds)}</Typography>
        <Typography variant="body2">Trade P/L ranged from <Box component="span" sx={{ color: pnlColor(longest.lowestPnlDecimal), fontWeight: 700 }}>{amount(longest.lowestPnlDecimal, currency)}</Box> to <Box component="span" sx={{ color: pnlColor(longest.peakPnlDecimal), fontWeight: 700 }}>{amount(longest.peakPnlDecimal, currency)}</Box>.</Typography>
      </Box> : null}
      </Box>
      {!hideExecutionDetails ? <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography variant="body2" sx={{ fontWeight: 800 }}>Execution details · {review.fills.length}</Typography></AccordionSummary>
        <AccordionDetails><Typography variant="caption" color="text.secondary">Exit P/L below is gross profit or loss for that execution. It uses the average cost of the shares held immediately before the exit.</Typography><Stack spacing={1.25} sx={{ mt: 1 }}>
          {review.fills.map(fill => <Box key={fill.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{fill.label}</Typography><Typography variant="caption" color="text.secondary">{time(fill.time)}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(fill.quantity)} shares @ {amount(fill.price, currency)} · {formatJournalAnalyticsDecimal(fill.remaining)} remaining</Typography>{fill.grossPnl !== null ? <Typography variant="body2" sx={{ color: pnlColor(fill.grossPnl), fontWeight: 700 }}>Gross exit P/L: {amount(fill.grossPnl, currency)}</Typography> : null}</Box>)}
        </Stack></AccordionDetails>
      </Accordion> : null}
      {path?.firstRedAtUtcSeconds != null ? <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" } }}><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography variant="body2" sx={{ fontWeight: 800 }}>Position changes around first red</Typography></AccordionSummary><AccordionDetails><Stack spacing={0.5}>
        <Typography variant="body2">At the peak before first turning red: {path.positionQuantityAtPeakDecimal === null ? "N/A" : formatJournalAnalyticsDecimal(path.positionQuantityAtPeakDecimal)} shares held.</Typography>
        <Typography variant="body2">At the first red point: {path.positionQuantityAtRedDecimal === null ? "N/A" : formatJournalAnalyticsDecimal(path.positionQuantityAtRedDecimal)} shares held.</Typography>
        <Typography variant="body2">{path.partialExitBeforeRedCount} partial {path.partialExitBeforeRedCount === 1 ? "exit" : "exits"} between that peak and first turning red.</Typography>
        <Typography variant="body2">{path.addedAfterPeakCount} {path.addedAfterPeakCount === 1 ? "add" : "adds"} after that peak, across the rest of this trade.</Typography>
      </Stack></AccordionDetails></Accordion> : null}
      {path && path.profitOpportunities.length > 1 ? <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" } }}><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography variant="body2" sx={{ fontWeight: 800 }}>All profit windows · {path.profitOpportunities.length}</Typography></AccordionSummary><AccordionDetails><Stack spacing={1}>{path.profitOpportunities.map(window => <Typography key={`${window.startedAtUtcSeconds}-${window.endedAtUtcSeconds}`} variant="body2">{time(window.startedAtUtcSeconds)}–{time(window.endedAtUtcSeconds)} · {window.durationMinutes} min · {amount(window.lowestPnlDecimal, currency)} to {amount(window.peakPnlDecimal, currency)}</Typography>)}</Stack></AccordionDetails></Accordion> : null}
    </>}
    {children ? <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" } }}><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography variant="body2" sx={{ fontWeight: 800 }}>Entry, exit and candle context</Typography></AccordionSummary><AccordionDetails><Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Price distances are per share, not whole-trade profit. Candle activity is market volume, not the shares you traded. Candle patterns and indicators describe the saved candle context, not a recommendation.</Typography>{children}</AccordionDetails></Accordion> : null}
  </Stack>;
}
