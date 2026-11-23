"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, IconButton, Stack, Typography } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";

import type { ResolvedChartEvidence } from "@/src/modules/market-data/chart-evidence/contracts";
import type { AcceptedScannerDailyContext } from "@/src/modules/market-data/accepted-series/publisher";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { SCAN_METRICS, SCAN_SESSION_LABELS, type ScannerLevelRoom } from "@/src/modules/scanner/custom/definition";
import { scannerPriceIsCurrent } from "@/src/modules/scanner/custom/market-facts";
import type { ScannerSession } from "@/src/modules/scanner/live/contracts";
import { scannerRetestSetup, scannerSetupCandleContext, type ScannerSetupCandleContext,
  type ScannerSetupStudy } from "@/src/modules/scanner/custom/setup-details";
import type { ScanMomentumReading } from "@/src/modules/scanner/custom/signal-filters";
import { MarketChart } from "../charts/market-chart";
import { scannerPrice } from "../screeners/scanner-price";

const evidenceTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
});
const retestLabels = {
  waiting: "Waiting for a retest",
  in_retest_area: "Price is in the retest area",
  beyond_target: "Extended · Price is at or beyond the first target",
  past_invalidation: "Price is past the invalidation level",
} as const;
const evidenceVolume = new Intl.NumberFormat("en-US");
const volumeMultiple = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const studyNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const histogramPercent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 4, signDisplay: "exceptZero" });

export function ScannerStudyReadings({ readings }: { readings?: readonly ScannerSetupStudy[] }) {
  if (!readings?.length) return null;
  return <Box component="ul" aria-label="Study readings" sx={{m:0,pl:2.25}}>
    {readings.map(reading => <Typography variant="caption" component="li" key={reading.key}>
      {reading.frame && reading.frame + " "}{reading.label}
      {reading.value === null ? reading.state === "failed" ? " · No event in the selected window" : " · Reading unavailable" : <>
        {reading.unit !== "event" && " · " + studyNumber.format(reading.value) +
          (reading.unit === "multiple" ? "×" : reading.unit === "percent" ? "%" : "")}
        {reading.closedAt !== undefined && " · Closed " + evidenceTime.format(reading.closedAt)}
        {reading.state === "failed" && " · Outside filter"}
        {reading.state === "passed" && " · Outside matching group"}
      </>}
    </Typography>)}
  </Box>;
}

export function ScannerMatchChart({ evidence, initialTimeframe }: {
  evidence: ResolvedChartEvidence;
  initialTimeframe: ChartTimeframe;
}) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  return <MarketChart symbol={evidence.basis.symbol} timeframe={timeframe} onTimeframeChange={setTimeframe}
    evidence={evidence} compactMobile sx={{ height: { xs: "62dvh", md: 480 }, minHeight: 280 }} />;
}

export function ScannerInlineMatch({ reference, symbol, priceSnapshot, momentumReadings, studyReadings, onClose, onOpenCharts }: {
  reference: string;
  symbol: string;
  priceSnapshot?: { price: number; observedAt: number; sourceAt?: number; asOf: number; halted?: boolean; session?: ScannerSession };
  momentumReadings?: readonly ScanMomentumReading[];
  studyReadings?: readonly ScannerSetupStudy[];
  onClose: () => void;
  onOpenCharts: () => void;
}) {
  const [value, setValue] = useState<{ evidence: ResolvedChartEvidence; timeframe: ChartTimeframe;
    nearbyLevels?: ScannerLevelRoom[]; longerTerm?: AcceptedScannerDailyContext; priorCandle?: ScannerSetupCandleContext }>();
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ reference });
    void fetch("/api/scanners/evidence?" + query, { cache: "no-store", signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw Error("evidence_unavailable");
        const result = await response.json();
        if (result.state !== "ready" || result.timeframe !== "4h" || result.evidence?.basis?.symbol !== symbol) {
          throw Error("evidence_unavailable");
        }
        if (!abort.signal.aborted) setValue({
          evidence: result.evidence, timeframe: result.timeframe,
          nearbyLevels: Array.isArray(result.nearbyLevels) ? result.nearbyLevels : undefined,
          longerTerm: result.longerTerm,
          priorCandle: result.priorCandle,
        });
      })
      .catch(() => { if (!abort.signal.aborted) setUnavailable(true); });
    return () => abort.abort();
  }, [reference, symbol]);

  const eventLayer = value?.evidence.match?.events;
  const event = eventLayer?.state === "ready" ? eventLayer.facts.find(fact => fact.kind === "level-break") : undefined;
  const zoneLayer = value?.evidence.match?.zones;
  const target = event?.reference.kind === "zone" ? event.reference : undefined;
  const zone = zoneLayer?.state === "ready" && target ? zoneLayer.facts.find(item =>
    item.zoneId === target.zoneId && item.mapId === target.mapId && item.mapRevision === target.mapRevision) : undefined;
  const candleLayer = value?.evidence.match?.candles;
  const candle = candleLayer?.state === "ready" && event ? candleLayer.facts.find(fact =>
    fact.revision === event.trigger.revision && fact.interval.start === event.trigger.interval.start &&
    fact.interval.end === event.trigger.interval.end && fact.basis.seriesId === event.trigger.basis.seriesId) : undefined;
  const oppositeMomentum = event && momentumReadings?.find(reading => reading.metric === "macdHistogramPercent" &&
    reading.value !== null && reading.closedAt !== undefined &&
    (event.direction === "up" ? reading.value < 0 : reading.value > 0));
  const daily = zoneLayer?.state === "ready" && zoneLayer.facts.some(item => item.sourceFrame === "1D");
  const observed = priceSnapshot && Number.isSafeInteger(priceSnapshot.observedAt) && priceSnapshot.observedAt > 0 &&
    priceSnapshot.observedAt <= 8_640_000_000_000_000 && Number.isFinite(priceSnapshot.price) && priceSnapshot.price > 0
    ? priceSnapshot : undefined;
  const tradeAt = observed && !observed.halted && scannerPriceIsCurrent(observed.sourceAt, observed.asOf)
    ? observed.sourceAt : undefined;
  const pricePosition = observed && tradeAt !== undefined && zone && candle && tradeAt >= candle.interval.end * 1_000
    ? observed.price > zone.upper ? "Above the broken zone"
      : observed.price < zone.lower ? "Below the broken zone" : "Inside the broken zone"
    : undefined;
  const setup = event && zone ? scannerRetestSetup(event.direction, zone, value?.nearbyLevels ?? [],
    pricePosition ? observed?.price : undefined) : undefined;
  const triggerCandle = candle && scannerSetupCandleContext(candle.bar, candle.interval.end);
  const priorCandle = value?.priorCandle;
  const relativeVolume = triggerCandle && priorCandle && priorCandle.volume > 0
    ? triggerCandle.volume / priorCandle.volume : undefined;
  return <Box component="section" aria-label={symbol + " · 4H level evidence"} sx={{px:1,py:0.75,whiteSpace:"normal"}}>
    <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center",gap:1,flexWrap:"wrap"}}>
      <Typography component="h3" variant="subtitle2">{symbol} · 4H level evidence</Typography>
      <Stack direction="row" sx={{alignItems:"center",gap:0.5}}>
        {value && <Button component={Link} href={"/charts?evidence=" + encodeURIComponent(reference)}
          prefetch={false} onNavigate={onOpenCharts} variant="outlined" size="small">
          Open Market Charts
        </Button>}
        <IconButton aria-label={"Close " + symbol + " match evidence"} onClick={onClose}><CloseRounded /></IconButton>
      </Stack>
    </Stack>
    {unavailable ? <Alert severity="warning">Matched chart evidence is unavailable.</Alert> : value ? <>
      {event && zone && candle && <Stack spacing={0.5} sx={{pb:0.75, fontVariantNumeric:"tabular-nums"}}>
        <Typography variant="body2" sx={{fontWeight:700}}>
          4H closed at {scannerPrice(candle.bar.close)}, {event.direction === "up" ? "above" : "below"} {zone.side} at{" "}
          {scannerPrice(zone.lower)}–{scannerPrice(zone.upper)}.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Closed {evidenceTime.format(candle.interval.end * 1_000)} · Volume {evidenceVolume.format(candle.bar.volume)}
          {" · Level saved "}{evidenceTime.format(zone.firstAvailableAt * 1_000)}
        </Typography>
        {triggerCandle && priorCandle && <Stack component="section" aria-label="Previous full 4H candle comparison" spacing={0}>
          <Typography variant="caption" color="text.secondary">
            Prior full 4H closed {evidenceTime.format(priorCandle.closedAt * 1_000)}
          </Typography>
          <Typography variant="body2">
            Range {scannerPrice(triggerCandle.range)} · Prior range {scannerPrice(priorCandle.range)}
          </Typography>
          <Typography variant="body2">
            Prior volume {evidenceVolume.format(priorCandle.volume)} shares
            {relativeVolume !== undefined && Number.isFinite(relativeVolume) &&
              " · Break candle traded " + volumeMultiple.format(relativeVolume) + "× that volume"}
          </Typography>
        </Stack>}
        {observed && <Stack spacing={0}>
          <Typography variant="body2">
            {observed.halted ? "Price before halt" : tradeAt !== undefined ? "Scanner price" : "Last available price"} <strong>{scannerPrice(observed.price)}</strong>
            {pricePosition && " · " + pricePosition}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Observed {evidenceTime.format(observed.sourceAt ?? observed.observedAt)}
            {observed.session && " · " + SCAN_SESSION_LABELS[observed.session.toUpperCase() as keyof typeof SCAN_SESSION_LABELS]}
          </Typography>
        </Stack>}
        {setup && zone && event && <Box component="section" aria-label="Retest setup" sx={{pt:0.5}}>
          <Typography variant="body2">
            Retest area <strong>{scannerPrice(zone.lower)}–{scannerPrice(zone.upper)}</strong>
            {" · "}Reference {scannerPrice(setup.entryReference)}
          </Typography>
          {setup.risk > 0 && <Typography variant="caption" color="text.secondary">
            {scannerPrice(setup.risk)} from the retest reference to invalidation
          </Typography>}
          <Typography variant="body2" sx={{mt:0.25}}>
            {setup.readiness ? retestLabels[setup.readiness] : "Entry readiness needs a recent price"}
            {setup.distanceToEntry !== undefined && setup.distanceToEntry > 0 &&
              " · " + scannerPrice(setup.distanceToEntry) + " from retest area"}
          </Typography>
          <Box component="dl" aria-label="Setup scenarios" sx={{
            display:"grid", gridTemplateColumns:"max-content minmax(0, 1fr)", columnGap:0.75, rowGap:0.25, my:0.5,
            "& dt":{fontWeight:700}, "& dd":{m:0},
          }}>
            <Typography component="dt" variant="caption">Continuation</Typography>
            <Typography component="dd" variant="caption">
              Completed close {event.direction === "up" ? "above " : "below "}{scannerPrice(setup.entryReference)}.
              {setup.objectives[0] && " First objective " + scannerPrice(setup.objectives[0].edge) + "."}
            </Typography>
            <Typography component="dt" variant="caption">In the zone</Typography>
            <Typography component="dd" variant="caption">
              Completed close from {scannerPrice(zone.lower)} to {scannerPrice(zone.upper)}. Watch for the next close outside the zone.
            </Typography>
            <Typography component="dt" variant="caption">Invalidation</Typography>
            <Typography component="dd" variant="caption">
              A completed close {event.direction === "up" ? "below " : "above "}{scannerPrice(setup.invalidation)} invalidates this retest setup.
            </Typography>
          </Box>
        </Box>}
        {daily && <Typography variant="caption" color="text.secondary">Daily zones shown for context</Typography>}
        <ScannerStudyReadings readings={studyReadings} />
        {!!momentumReadings?.length && <Box component="ul" aria-label="Momentum readings" sx={{m:0,pl:2.25}}>
          {momentumReadings.map(reading => <Typography variant="caption" component="li" key={reading.ruleIndex}>
            {reading === oppositeMomentum && "Mixed readings · "}
            {reading.frame} {SCAN_METRICS[reading.metric].label} · {reading.value === null || reading.closedAt === undefined
              ? "History incomplete"
              : <>{reading.metric === "macdHistogramPercent" ? histogramPercent.format(reading.value / 100)
                : reading.value.toLocaleString("en-US",{maximumFractionDigits:2})}
                {" · Closed "}{evidenceTime.format(reading.closedAt)}</>}
          </Typography>)}
        </Box>}
        {value.longerTerm && <Typography variant="caption" color="text.secondary">
          {(["daily", "weekly"] as const).map(frame => {
            const reading = value.longerTerm?.[frame];
            const label = frame === "daily" ? "Daily" : "Weekly";
            return reading ? `${label} ${histogramPercent.format(reading.changePercent / 100)} · Closed ${evidenceTime.format(reading.closedAtMs)}`
              : label + " history incomplete";
          }).join(" · ")}
        </Typography>}
      </Stack>}
      <ScannerMatchChart evidence={value.evidence} initialTimeframe={value.timeframe} />
      {!!value.nearbyLevels?.length && <Box component="section" aria-label="Room to next levels" sx={{pt:0.75}}>
        <Typography variant="subtitle2" component="h4">Room from the confirmed close</Typography>
        <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2, minmax(0, 1fr))"},gap:0.5,mt:0.5}}>
          {value.nearbyLevels.map(level => {
            const objective = setup?.objectives.find(candidate => candidate.zoneId === level.zoneId);
            return <Stack key={level.zoneId} spacing={0.25}
            sx={{border:1,borderColor:"divider",px:1,py:0.5,fontVariantNumeric:"tabular-nums"}}>
            <Typography variant="caption" color="text.secondary">{level.frame === "1D" ? "Daily" : "4H"} {level.side}</Typography>
            <Typography variant="body2" sx={{fontWeight:700}}>{scannerPrice(level.lower)}–{scannerPrice(level.upper)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {level.distance === 0 ? "Confirmed close is inside this zone" : scannerPrice(level.distance) + " away"}
            </Typography>
            {objective?.rewardToRisk !== undefined && <Typography variant="caption">
              {scannerPrice(objective.distanceFromEntry)} from the retest reference · {objective.rewardToRisk.toFixed(2)}:1 reward to risk
            </Typography>}
          </Stack>;
          })}
        </Box>
      </Box>}
    </> : <Typography role="status" variant="body2">Loading matched candle and level…</Typography>}
  </Box>;
}
