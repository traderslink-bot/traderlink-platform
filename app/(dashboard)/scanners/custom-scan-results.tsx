"use client";

import { eventFilters, isReaction } from "@/src/modules/scanner/custom/audited-filters";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { Alert, Box, Button, Checkbox, FormControlLabel, IconButton, Popover, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import CandlestickChartOutlined from "@mui/icons-material/CandlestickChartOutlined";
import ShowChartOutlined from "@mui/icons-material/ShowChartOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PauseRounded from "@mui/icons-material/PauseRounded";
import { CLOSED_SCAN_MESSAGE, isDirectionalPriceMove, isEventScanMetric, isScanSelectionMetric, isSignedScanMetric, isSwingPullbackMetric, scanRules, SCAN_METRICS, SCAN_PAGE_SIZE, SCAN_SESSION_LABELS, type ScanDefinition, type ScanFilterCoverage, type ScanMetric, type ScanResult, type ScanResultRow, type ScanTrendReading } from "@/src/modules/scanner/custom/definition";
import { scannerScrollStyles, scannerStickyTickerSx } from "@/src/modules/scanner/live/scroll-styles";
import { SCANNER_SECURITY_TYPES, scannerSecurityType } from "@/src/modules/scanner/live/security-types";
import { SCANNER_SESSION_VOLUME_COLUMNS } from "@/src/modules/scanner/live/volume";
import { SCAN_BASE_RESULT_COLUMNS, scanResultColumnLabel, selectedScanResultColumns } from "@/src/modules/scanner/custom/result-columns";
import { ScannerRowNews } from "../screeners/scanner-news-drawer-context";
import { ScannerCountryFlag } from "../screeners/scanner-country-flag";
import { scannerPrice } from "../screeners/scanner-price";
import { scannerGainColor } from "../screeners/scanner-gain-color";
import type { ScannerChartTarget } from "../screeners/scanner-chart-workspace";

const eventTime = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const compactNumber = new Intl.NumberFormat("en-US", { notation:"compact", maximumFractionDigits:2 });
const multiple = new Intl.NumberFormat("en-US", { maximumFractionDigits:2 });
const signedPercent = new Intl.NumberFormat("en-US",{style:"percent",maximumFractionDigits:2,signDisplay:"exceptZero"});
const percent = new Intl.NumberFormat("en-US",{style:"percent",maximumFractionDigits:2});
function filterCoverageText({ checked, failed, unknown }: ScanFilterCoverage) {
  return `${checked - failed - unknown} passed, ${failed} outside filter, ${unknown} need data`;
}
function closeVsAverageText(frame: string, average: string, reading?: ScanTrendReading) {
  if (!reading) return frame + " trend unavailable";
  const position = reading.distance > 0 ? "above" : reading.distance < 0 ? "below" : "at";
  return `${frame} ${position} ${average} · ${signedPercent.format(reading.distance / 100)} · Closed ${eventTime.format(reading.closedAt)} ET`;
}
function format(metric: ScanMetric, value: number | null, cross=false) {
  if (value === null) return "—";
  if(metric==="activeHalt")return value === 1 ? "Halted" : "Trading";
  if(cross||isEventScanMetric(metric))return eventTime.format(value);
  if (metric === "price") return scannerPrice(value);
  if (metric === "customEma" || metric === "customSma") return signedPercent.format(value/100);
  const { unit } = SCAN_METRICS[metric];
  if (unit === "percent") return (isSignedScanMetric(metric) || metric === "rollingMove" ? signedPercent : percent).format(value/100);
  if (unit === "multiple") return multiple.format(value) + "×";
  if (unit === "money") return metric === "dollarVolume" || metric === "rollingDollarVolume" || metric === "marketCap" || metric==="floatMarketCap" || metric==="largestTradeDollars"
    ? "$" + compactNumber.format(value) : scannerPrice(value);
  return compactNumber.format(value);
}
export function CustomScanResults({ definition, result, error, page, onPage, onChart, onTicker, onEditFilters, addToWatchlist, mode = "table", match, inlineChart }: {
  definition: ScanDefinition; result?: ScanResult; error:string; page?:number; onPage?:(page:number)=>void;
  onChart:(target:ScannerChartTarget)=>void; onTicker?:(symbol:string)=>void; onEditFilters?:() => void; mode?:"table" | "cards" | "two-rows";
  addToWatchlist?: (form: FormData) => Promise<{ error: string | null; success: string | null }>;
  inlineChart?: { symbol?: string; onToggle: (symbol:string) => void; content: (row:ScanResultRow) => ReactNode };
  match?: { reference: string | undefined; onOpen: (reference: string) => void; content: (row: ScanResultRow, reference: string) => ReactNode };
}) {
  const [reason, setReason] = useState<{ symbol: string; definition: ScanDefinition }>();
  const shownReason = reason?.definition === definition ? reason.symbol : undefined;
  const [adding, setAdding] = useState<string>();
  const [watchlistNotice, setWatchlistNotice] = useState<{ text: string; failed: boolean }>();
  const watchlistRequests = useRef(new Map<string, string>());
  const [columnAnchor, setColumnAnchor] = useState<HTMLButtonElement>();
  const [columnOverrides, setColumnOverrides] = useState<Record<string, boolean>>({});
  const allExtras = selectedScanResultColumns(definition);
  const extraVisible = ([key, field]: typeof allExtras[number]) => columnOverrides[key] ?? field.metric !== "volume";
  const extras = allExtras.filter(extraVisible);
  const rules = scanRules(definition);
  if (result?.status === "closed") return <Alert severity="info">{CLOSED_SCAN_MESSAGE}</Alert>;
  if (result?.status === "unavailable") return <Alert severity="warning">Scanner data is temporarily unavailable.</Alert>;
  if (!result || result.status === "waiting") return <Alert severity={error ? "warning" : "info"}>{error || "Waiting for scanner data…"}</Alert>;

  const cell = (metric:ScanMetric,value:number|null,change?:number|null,cross=false) => {
    const direction=cross?null:metric==="price"?change:(metric==="customEma"||metric==="customSma")?value:((isSignedScanMetric(metric)&&metric!=="bollingerPercentB")||isDirectionalPriceMove(metric))?value:
      metric==="belowHigh"&&value!==null?-value:null;
    return <Box component="span" sx={{color:direction!=null?scannerGainColor(direction):undefined}}>
      {format(metric,value,cross)}
    </Box>;
  };
  const symbol = (row:ScanResultRow) => <Stack>
    <Stack direction="row" sx={{alignItems:"center",gap:0.5}}>
    {onTicker
      ? <Button size="small" aria-label={"Load " + row.symbol + " in the Scanner chart"} onClick={() => onTicker(row.symbol)}
        sx={{color:"warning.main",fontWeight:750,minWidth:0,minHeight:36,px:0.25,py:0}}>{row.symbol}</Button>
      : <Box component="span" sx={{color:"warning.main",fontWeight:750}}>{row.symbol}</Box>}
    {row.halted && <PauseRounded fontSize="small" aria-label="Trading halted"/>}
    </Stack>
    {row.matchSummary ? <Typography variant="caption" color="text.secondary">{row.matchSummary}</Typography> : null}
  </Stack>;
  const openChart = (row:ScanResultRow) => <IconButton size="small" aria-label={"Open " + row.symbol + " chart"} title="Open chart" onClick={()=>onChart({...row,showDetails:true})}
      sx={{color:"success.main",minWidth:36,minHeight:36}}><CandlestickChartOutlined fontSize="small"/></IconButton>
  const inlineChartAction = (row: ScanResultRow) => inlineChart && <IconButton size="small"
    title="Show chart in results" aria-label={"Show " + row.symbol + " chart in results"}
    aria-expanded={inlineChart.symbol === row.symbol} onClick={() => inlineChart.onToggle(row.symbol)}
    sx={{minWidth:36,minHeight:36}}><ShowChartOutlined fontSize="small"/></IconButton>;
  const watchlistAction = (row: ScanResultRow) => addToWatchlist && <IconButton size="small"
    aria-label={"Add " + row.symbol + " to Private Watchlist"} title="Add to Private Watchlist" disabled={!!adding}
    sx={{minWidth:36,minHeight:36}} onClick={async () => {
      const requestId = watchlistRequests.current.get(row.symbol) ?? crypto.randomUUID();
      watchlistRequests.current.set(row.symbol, requestId);
      const form = new FormData();
      form.set("requestId", requestId);
      form.set("symbol", row.symbol);
      setAdding(row.symbol);
      setWatchlistNotice(undefined);
      try {
        const outcome = await addToWatchlist(form);
        setWatchlistNotice({ text: outcome.error ?? row.symbol + " is in your Private Watchlist.", failed: !!outcome.error });
      } catch {
        setWatchlistNotice({ text: "Private Watchlist could not be updated. Try again.", failed: true });
      } finally {
        setAdding(undefined);
      }
    }}><AddOutlined fontSize="small" /></IconButton>;
  const releaseAction=(row:ScanResultRow)=>{
    const release = row.pressRelease;
    if (!release) return <ScannerRowNews news={[]}/>;
    const publishedAt = new Date(release.at).toISOString();
    return <ScannerRowNews news={[{id:release.id,headline:release.title,createdAt:publishedAt,publishedAt,
      url:release.url,typeLabel:"Press Release"}]}/>;
  };
  const evidenceAction = (row: ScanResultRow) => {
    const ruleReferences = [...new Set(Object.values(row.matchedLevelEvidence ?? {}))];
    const reference = ruleReferences.length === 1 ? ruleReferences[0] : row.evidenceReference;
    if (!match || !reference || ruleReferences.length > 1) return null;
    return <IconButton size="small" aria-label={"Open " + row.symbol + " 4H level evidence"} title="4H level evidence"
      aria-expanded={match.reference === reference} onClick={() => match.onOpen(reference)}
      sx={{minWidth:36,minHeight:36}}><LayersOutlined fontSize="small" /></IconButton>;
  };
  const reasonAction = (row: ScanResultRow) => !!row.matchedRuleIndexes?.length &&
    <IconButton size="small" aria-label={"Why " + row.symbol + " matched"} title="Why it matched"
      aria-expanded={shownReason === row.symbol}
      onClick={() => setReason(current => current?.symbol === row.symbol && current.definition === definition
        ? undefined : { symbol: row.symbol, definition })}
      sx={{minWidth:36,minHeight:36}}><InfoOutlined fontSize="small" /></IconButton>;
  const reasons = (row: ScanResultRow) => {
    if (shownReason !== row.symbol || !row.matchedRuleIndexes?.length) return null;
    const matched = new Set(row.matchedRuleIndexes);
    const groups = definition.groups ?? [];
    const showAlternatives = definition.match === "any" || groups.some(group => group.match === "any");
    const reasonLine = (index: number) => {
      const rule = rules[index];
      if (!rule) return null;
      const contributed = matched.has(index);
      if (!showAlternatives && !contributed) return null;
      const field = allExtras.find(([, item]) => item.index === index)?.[1];
      const label = field?.label ?? [
        rule.frame ?? (rule.minutes ? rule.minutes + "m" : undefined),
        SCAN_METRICS[rule.metric].label,
      ].filter(Boolean).join(" ");
      const alternative = row.alternativeReadings?.[index];
      const momentum = row.momentumReadings?.find(item => item.ruleIndex === index);
      const alternateState = alternative?.[0];
      const reading = contributed ? row.matches[index]
        : alternative && alternative[0] !== "unavailable" ? alternative[1] : momentum?.value ?? null;
      const status = contributed ? "Matched"
        : alternateState === "passed" ? "Passed in a group that did not match"
        : alternateState === "failed" || momentum?.met === false ? "Outside filter"
        : alternateState === "unavailable" || momentum ? "Data unavailable" : "Not checked";
      const checked = contributed || alternateState === "passed" || alternateState === "failed" || momentum?.value != null;
      let value = reading === null
        ? rule.includeUnknown ? "Unknown value included" : "None in the selected window"
        : format(rule.metric, reading, field?.cross);
      if (rule.metric==="prHeadline" || rule.metric==="recentFiling" || rule.metric==="haltCode" || rule.metric==="zoneState"){
        value=rule.metric==="prHeadline" ? row.pressRelease?.title??"Headline matched" : (rule.selection??[]).join(", ");
      } else if (isScanSelectionMetric(rule.metric)) {
        const session = row.session?.toUpperCase() as keyof typeof SCAN_SESSION_LABELS | undefined;
        const selection = rule.metric === "tickerList" ? row.symbol : rule.metric === "listingExchange" ? row.exchange
          : rule.metric === "listingIndustry" ? row.industry : rule.metric === "listingSector" ? row.sector : rule.metric === "tradingSession"
            ? session && SCAN_SESSION_LABELS[session] : rule.metric === "listingSecurityType" ?
              row.securityType && SCANNER_SECURITY_TYPES[row.securityType] : row.country;
        value = (selection ?? "Unknown") + " · " + (rule.selection ?? [])
          .map(item => {
            if (rule.metric === "tradingSession") return SCAN_SESSION_LABELS[item as keyof typeof SCAN_SESSION_LABELS] ?? item;
            const type = rule.metric === "listingSecurityType" ? scannerSecurityType(item) : undefined;
            return type ? SCANNER_SECURITY_TYPES[type] : item;
          })
          .join(", ");
      } else if (isEventScanMetric(rule.metric) && rule.maximum !== null) {
        value += isReaction(rule.metric) ? " · within "+rule.maximum+" minutes" : Object.hasOwn(eventFilters,rule.metric)
          ? " · latest completed 1m candle" : " · past " + rule.maximum + (rule.metric === "indicatorSignal" || rule.metric === "tradeResumed" ? " minutes" : " hours");
      } else if (!rule.indicator && rule.metric !== "activeHalt") {
        const bounds = [
          rule.minimum === null ? null : "≥ " + format(rule.metric, rule.minimum),
          rule.maximum === null ? null : "≤ " + format(rule.metric, rule.maximum),
        ].filter(Boolean).join(" and ");
        const comparison = isDirectionalPriceMove(rule.metric)
          ? (rule.direction === "down" ? "Down " : rule.direction === "either" ? "Either direction " : "Up ") + bounds
          : bounds;
        if (comparison) value += " · " + comparison;
      }
      const reference = contributed ? row.matchedLevelEvidence?.[index] : undefined;
      const readingTime = row.matchedStudyTimes?.[index] ??
        (alternateState !== "unavailable" ? alternative?.[2] : undefined) ?? momentum?.closedAt;
      const quoteTime = reading !== null && (rule.metric === "bidAskSpread" || rule.metric === "bidAskSpreadPercent")
        ? row.quoteObservedAt : undefined;
      const observedTime = reading === null ? undefined : isSwingPullbackMetric(rule.metric) ? row.priceSourceAt
        : (rule.metric === "price" || isDirectionalPriceMove(rule.metric)) ? row.priceObservedAt : undefined;
      return <Typography key={index} component="li" variant="body2" color={contributed ? "text.primary" : "text.secondary"}>
        {label}
        {showAlternatives && " · " + status}
        {checked && " · " + value}
        {readingTime !== undefined && " · Closed " + eventTime.format(readingTime) + " ET"}
        {quoteTime !== undefined && " · Quote " + eventTime.format(quoteTime) + " ET"}
        {observedTime !== undefined && " · Observed " + eventTime.format(observedTime) + " ET"}
        {match && reference && <Button size="small" variant="outlined" sx={{ml:0.75}}
          aria-expanded={match.reference === reference} onClick={() => match.onOpen(reference)}>View candle and level</Button>}
      </Typography>;
    };
    let start = definition.rules.length;
    const trend = row.trendContext;
    const mixedTrend = trend?.daily && trend.weekly && trend.daily.distance * trend.weekly.distance < 0;
    return <Box role="group" aria-label={"Filters for " + row.symbol} sx={{my:0.5,px:1,whiteSpace:"normal",overflowWrap:"anywhere"}}>
      {trend && <Stack aria-label="Daily and Weekly trend" sx={{mb:0.5, fontVariantNumeric:"tabular-nums"}}>
        {mixedTrend && <Typography variant="body2" sx={{fontWeight:650}}>Daily and Weekly trends disagree</Typography>}
        <Typography variant="body2">{closeVsAverageText("Daily", "20-session SMA", trend.daily)}</Typography>
        <Typography variant="body2">{closeVsAverageText("Weekly", "4-week SMA", trend.weekly)}</Typography>
      </Stack>}
      {(showAlternatives || groups.length > 0) && <Typography variant="caption" color="text.secondary">
        {definition.match === "any" ? "Match any filter or group" : "Match all filters and groups"}
      </Typography>}
      <Box component="ul" sx={{my:0.25,pl:2.5}}>
        {definition.rules.map((_, index) => reasonLine(index))}
        {groups.map((group, groupIndex) => {
          const indexes = group.rules.map((_, index) => start + index);
          start += group.rules.length;
          const passed = indexes.filter(index => matched.has(index)).length;
          return <Box component="li" key={groupIndex} sx={{mt:0.5}}>
            <Typography variant="body2" sx={{fontWeight:650}}>
              {group.match === "all" ? "All" : "Any"} group · {passed} of {indexes.length} contributed
            </Typography>
            <Box component="ul" sx={{pl:2}}>{indexes.map(reasonLine)}</Box>
          </Box>;
        })}
        {!row.evidenceReference && !Object.keys(row.matchedLevelEvidence ?? {}).length &&
          <Typography component="li" variant="body2" color="text.secondary">These filters did not define an entry or target.</Typography>}
      </Box>
    </Box>;
  };
  const expanded = (row: ScanResultRow) => {
    const reference = match?.reference;
    return reference && (reference === row.evidenceReference || Object.values(row.matchedLevelEvidence ?? {}).includes(reference))
      ? reference : undefined;
  };
  const chartEvidence = (row: ScanResultRow) => {
    const reference = expanded(row);
    if (reference) return match?.content(row, reference);
    return inlineChart?.symbol === row.symbol ? inlineChart?.content(row) : null;
  };
  const coverage = [
    result.total + " matched",
    result.excluded === undefined ? null : result.excluded + " didn't match",
    result.incomplete + " need more data",
  ].filter(Boolean).join(" · ");
  if (result.total === 0) {
    let message = "No matches in this update.";
    if (result.eligible === 0) message = "No eligible tickers in this scan.";
    else if (result.incomplete > 0) {
      message = result.incomplete === result.eligible
        ? "Waiting for data to evaluate these filters."
        : "No matches yet. Some tickers still need more data.";
    }
    return <Stack spacing={0.5}>
      {error && <Alert severity="warning">{error}</Alert>}
      <Alert severity="info" action={onEditFilters && <Button color="inherit" variant="outlined" size="small"
        onClick={onEditFilters}>Edit filters</Button>}>{message}</Alert>
      <Typography variant="caption" color="text.secondary">{coverage}</Typography>
      {!!result.groupCoverage?.length && <Stack component="ul" aria-label="Group coverage" sx={{m:0, pl:2.5}}>
        {result.groupCoverage.map((coverage, index) => <Typography key={index} component="li" variant="caption">
          {definition.groups?.[index]?.match === "any" ? "Any" : "All"} group {index + 1} ·
          {coverage.checked ? " " + filterCoverageText(coverage) : " Not checked"}
        </Typography>)}
      </Stack>}
      {!!result.ruleCoverage?.length && <Stack component="ul" aria-label="Filter coverage" sx={{m:0, pl:2.5}}>
        {result.ruleCoverage.map(({checked,failed,unknown}, index) => {
          const rule = rules[index];
          if (!rule) return null;
          const column = allExtras.find(([, item]) => item.index === index)?.[1];
          return <Typography key={index} component="li" variant="caption">
            {column?.label ?? SCAN_METRICS[rule.metric].label} ·
            {checked ? " " + filterCoverageText({ checked, failed, unknown }) : " Not checked"}
          </Typography>;
        })}
      </Stack>}
    </Stack>;
  }
  const optionalFields = ["dayVolume", "dollarVolume", "float", "marketCap", ...SCANNER_SESSION_VOLUME_COLUMNS] as const;
  const baseFieldVisible = (metric: typeof optionalFields[number]) =>
    columnOverrides[metric] ?? (metric === "dayVolume" || metric === "float" ||
      (mode !== "cards" && (metric === "dollarVolume" || metric === "marketCap")));
  const fields = [
    ...(mode === "two-rows" ? [] : SCAN_BASE_RESULT_COLUMNS.slice(0, 2)),
    ...optionalFields.filter(baseFieldVisible),
  ];
  const columnOptions = [
    ...optionalFields.map(metric => ({ key: metric, label: scanResultColumnLabel(metric), visible: baseFieldVisible(metric) })),
    ...allExtras.map(entry => ({ key: entry[0], label: entry[1].label, visible: extraVisible(entry) })),
  ];

  return <Stack spacing={0.5} sx={{minHeight:0,minWidth:0,flex:1}}>
    {error && <Alert severity="warning">{error}</Alert>}
    {watchlistNotice && <Alert severity={watchlistNotice.failed ? "warning" : "success"}
      onClose={() => setWatchlistNotice(undefined)}>{watchlistNotice.text}</Alert>}
    <Box sx={{alignSelf:"flex-end"}}>
      <Button size="small" color="inherit" variant="outlined" aria-haspopup="dialog"
        aria-expanded={Boolean(columnAnchor)} aria-controls={columnAnchor ? "scanner-result-columns" : undefined}
        onClick={event => setColumnAnchor(event.currentTarget)}>Columns</Button>
      <Popover open={Boolean(columnAnchor)} anchorEl={columnAnchor} onClose={() => setColumnAnchor(undefined)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <Stack id="scanner-result-columns" role="dialog" aria-label="Result columns" sx={{p:1.5, maxWidth:320, maxHeight:360, overflowY:"auto"}}>
          {columnOptions.map(({ key, label, visible }) => <FormControlLabel key={key} label={label}
            control={<Checkbox size="small" checked={visible} onChange={event => {
              const checked = event.target.checked;
              setColumnOverrides(current => ({ ...current, [key]: checked }));
            }} />} />)}
          <Button size="small" color="inherit" onClick={() => setColumnOverrides({})}>Reset columns</Button>
        </Stack>
      </Popover>
    </Box>
    {mode === "cards" ? <Stack component="section" aria-label="Scan result cards" spacing={0.75} sx={{overflowY:"auto",minHeight:0}}>
      {result.rows.map(row=><Box component="article" aria-label={row.symbol + " result"} key={row.symbol}
        sx={{border:1,borderColor:"divider",px:1,py:0.75}}>
        <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:0.5,flexWrap:"wrap"}}>
          <Stack direction="row" sx={{alignItems:"center",gap:0.5}}>
            {symbol(row)}<ScannerCountryFlag country={row.country}/>
          </Stack>
          <Stack direction="row" sx={{alignItems:"baseline",gap:0.75,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>
            {cell("price",row.price,row.dayChange)}{cell("dayChange",row.dayChange)}
          </Stack>
        </Stack>
        <Stack direction="row" sx={{gap:1,flexWrap:"wrap",fontSize:"0.74rem"}}>
          {optionalFields.filter(baseFieldVisible).map(metric =>
            <span key={metric}>{scanResultColumnLabel(metric)} {cell(metric,row[metric] ?? null)}</span>)}
          {extras.map(([key,field])=><span key={key}>{field.label} {cell(field.metric,field.index===undefined?row.sortValue:row.matches[field.index],undefined,field.cross)}</span>)}
        </Stack>
        <Stack direction="row" sx={{alignItems:"center",gap:0.5,flexWrap:"wrap"}}>
          {openChart(row)}{inlineChartAction(row)}{releaseAction(row)}{watchlistAction(row)}{reasonAction(row)}{evidenceAction(row)}
        </Stack>
        {reasons(row)}
        {chartEvidence(row)}
      </Box>)}
    </Stack> : <TableContainer sx={theme=>({...scannerScrollStyles(theme),minHeight:0,flex:1,maxHeight:onPage?{xs:"none",md:"calc(100dvh - 195px)"}:undefined})}>
      <Table size="small" stickyHeader aria-label="Live scan results" sx={{...scannerStickyTickerSx,
        "& .MuiTableCell-root":{whiteSpace:"nowrap",px:1,py:0.25,fontVariantNumeric:"tabular-nums"}}}>
        <TableHead><TableRow>
          <TableCell data-scanner-sticky-ticker scope="col">Ticker</TableCell>
          <TableCell scope="col" aria-label="Result actions" sx={{width:1}}/>
          {fields.map(metric=><TableCell align="right" key={metric} scope="col">{scanResultColumnLabel(metric)}</TableCell>)}
          {extras.map(([key,field])=><TableCell align="right" key={key} scope="col">{field.label}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>{result.rows.map(row=><Fragment key={row.symbol}><TableRow hover>
          <TableCell data-scanner-sticky-ticker>
            {mode==="two-rows"?<>{symbol(row)}<ScannerCountryFlag country={row.country}/></>:
              <Stack direction="row" sx={{alignItems:"center",gap:0.5}}>{symbol(row)}<ScannerCountryFlag country={row.country}/></Stack>}
          </TableCell>
          <TableCell><Stack direction="row" sx={{alignItems:"center",gap:0.25}}>{openChart(row)}{inlineChartAction(row)}{releaseAction(row)}{watchlistAction(row)}{reasonAction(row)}{evidenceAction(row)}</Stack>{mode==="two-rows" &&
            <Stack direction="row" sx={{gap:0.5}}>{cell("price",row.price,row.dayChange)}{cell("dayChange",row.dayChange)}</Stack>}</TableCell>
          {fields.map(metric=><TableCell align="right" key={metric}>{cell(metric,row[metric] ?? null,row.dayChange)}</TableCell>)}
          {extras.map(([key,field])=><TableCell align="right" key={key}>{cell(field.metric,field.index===undefined?row.sortValue:row.matches[field.index],undefined,field.cross)}</TableCell>)}
        </TableRow>
        {(expanded(row) || inlineChart?.symbol === row.symbol || (shownReason === row.symbol && !!row.matchedRuleIndexes?.length)) && <TableRow><TableCell colSpan={fields.length + extras.length + 2} sx={{p:0}}>
          <Box sx={{position:"sticky",left:0,maxWidth:"calc(100vw - 48px)",minWidth:0}}>
            {reasons(row)}
            {chartEvidence(row)}
          </Box>
        </TableCell></TableRow>}
        </Fragment>)}</TableBody>
      </Table>
    </TableContainer>}
    {onPage && <Stack direction="row" sx={{alignItems:"center",gap:1,flexWrap:"wrap",justifyContent:"space-between",px:0.5}}>
      <Typography variant="caption">{coverage}</Typography>
      {page && (page>1 || result.total>SCAN_PAGE_SIZE) ? <Stack direction="row" sx={{alignItems:"center",gap:0.5}}>
        <Button size="small" variant="outlined" disabled={page===1} onClick={()=>onPage(page-1)}>Previous</Button>
        <Typography variant="caption">Page {page}</Typography>
        <Button size="small" variant="outlined" disabled={result.total<=page*SCAN_PAGE_SIZE} onClick={()=>onPage(page+1)}>Next</Button>
      </Stack> : null}
    </Stack>}
  </Stack>;
}
