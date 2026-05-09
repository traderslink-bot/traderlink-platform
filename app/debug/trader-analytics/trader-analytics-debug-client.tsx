"use client";

import { useMemo, useState } from "react";
import type {
  TraderAnalyticsChart,
  TraderAnalyticsChartDatum,
  TraderAnalyticsChartTone,
  TraderAnalyticsReport,
  TraderAnalyticsTradeRow,
} from "../../../src/lib/trader-analytics";

type ApiState =
  | { status: "idle"; body: null; error: null }
  | { status: "loading"; body: null; error: null }
  | { status: "success"; body: TraderAnalyticsReport; error: null }
  | { status: "error"; body: null; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildApiBody(document: unknown): unknown {
  if (Array.isArray(document)) {
    return {
      requests: document,
    };
  }

  if (
    isRecord(document) &&
    ("request" in document ||
      "trade" in document ||
      "requests" in document ||
      "trades" in document ||
      "summaries" in document)
  ) {
    return document;
  }

  return {
    request: document,
  };
}

function formatNumber(value: number | null, digits = 2): string {
  return typeof value === "number" ? value.toFixed(digits) : "n/a";
}

function formatSignedNumber(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatPercent(value: number | null): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "n/a";
}

function toneTextClass(tone: TraderAnalyticsChartTone): string {
  switch (tone) {
    case "positive":
      return "text-emerald-300";
    case "negative":
      return "text-rose-300";
    case "warning":
      return "text-amber-300";
    case "info":
      return "text-sky-300";
    case "accent":
      return "text-violet-300";
    default:
      return "text-zinc-300";
  }
}

function toneBgClass(tone: TraderAnalyticsChartTone): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-500";
    case "negative":
      return "bg-rose-500";
    case "warning":
      return "bg-amber-400";
    case "info":
      return "bg-sky-400";
    case "accent":
      return "bg-violet-400";
    default:
      return "bg-zinc-500";
  }
}

function toneHex(tone: TraderAnalyticsChartTone): string {
  switch (tone) {
    case "positive":
      return "#10b981";
    case "negative":
      return "#f43f5e";
    case "warning":
      return "#f59e0b";
    case "info":
      return "#38bdf8";
    case "accent":
      return "#a78bfa";
    default:
      return "#71717a";
  }
}

function KpiCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: TraderAnalyticsChartTone;
}) {
  return (
    <div className="min-h-[112px] border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-semibold ${toneTextClass(tone)}`}>
        {value}
      </div>
      <div className="mt-2 text-sm text-zinc-500">{detail}</div>
    </div>
  );
}

function HorizontalBarChart({ chart }: { chart: TraderAnalyticsChart }) {
  const maxValue = Math.max(...chart.data.map((datum) => datum.value), 0);

  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">{chart.title}</h2>
        <span className="font-mono text-xs text-zinc-500">
          total {formatNumber(chart.total, 0)}
        </span>
      </div>
      <div className="mt-4 flex min-h-[180px] flex-col gap-3">
        {chart.empty ? (
          <div className="py-8 text-sm text-zinc-500">No data</div>
        ) : (
          chart.data.map((datum) => {
            const width =
              maxValue > 0 ? Math.max((datum.value / maxValue) * 100, 3) : 0;

            return (
              <div key={datum.id} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-zinc-300">{datum.label}</span>
                  <span className="font-mono text-zinc-500">
                    {formatNumber(datum.value, 0)}
                    {datum.pctOfTotal !== null
                      ? ` / ${formatPercent(datum.pctOfTotal)}`
                      : ""}
                  </span>
                </div>
                <div className="h-2 bg-zinc-900">
                  <div
                    className={`h-2 ${toneBgClass(datum.tone)}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function DistributionBar({ chart }: { chart: TraderAnalyticsChart }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">{chart.title}</h2>
      <div className="mt-4 h-4 w-full overflow-hidden bg-zinc-900">
        {chart.empty ? (
          <div className="h-full w-full bg-zinc-800" />
        ) : (
          <div className="flex h-full">
            {chart.data.map((datum) => (
              <div
                key={datum.id}
                className={toneBgClass(datum.tone)}
                style={{
                  width: `${Math.max((datum.pctOfTotal ?? 0) * 100, 2)}%`,
                }}
                title={`${datum.label}: ${datum.value}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {chart.data.map((datum) => (
          <div
            key={datum.id}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="truncate text-zinc-400">{datum.label}</span>
            <span className="font-mono text-zinc-500">
              {datum.value} / {formatPercent(datum.pctOfTotal)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildConicGradient(data: TraderAnalyticsChartDatum[]): string {
  if (data.length === 0) {
    return "#27272a";
  }

  let start = 0;
  const segments = data.map((datum) => {
    const pct = datum.pctOfTotal ?? 0;
    const end = start + pct * 360;
    const segment = `${toneHex(datum.tone)} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function DonutChart({ chart }: { chart: TraderAnalyticsChart }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">{chart.title}</h2>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{ background: buildConicGradient(chart.data) }}
        >
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-zinc-950 text-center">
            <div>
              <div className="font-mono text-2xl text-zinc-100">
                {formatNumber(chart.total, 0)}
              </div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                trades
              </div>
            </div>
          </div>
        </div>
        <div className="grid flex-1 gap-2">
          {chart.data.map((datum) => (
            <div
              key={datum.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className={toneTextClass(datum.tone)}>{datum.label}</span>
              <span className="font-mono text-zinc-500">
                {datum.value} / {formatPercent(datum.pctOfTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrossPnlSeries({ chart }: { chart: TraderAnalyticsChart }) {
  const maxAbs = Math.max(
    ...chart.data.map((datum) => Math.abs(datum.value)),
    1,
  );
  const width = Math.max(chart.data.length * 62, 360);
  const height = 220;
  const zeroY = height / 2;
  const barWidth = Math.max(Math.min(width / Math.max(chart.data.length, 1) - 18, 42), 18);

  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">{chart.title}</h2>
        <span className="font-mono text-xs text-zinc-500">
          gross {formatSignedNumber(chart.total)}
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg
          className="h-[220px]"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
        >
          <line
            x1="0"
            y1={zeroY}
            x2={width}
            y2={zeroY}
            stroke="#3f3f46"
            strokeWidth="1"
          />
          {chart.data.map((datum, index) => {
            const barHeight = Math.max(
              (Math.abs(datum.value) / maxAbs) * 82,
              datum.value === 0 ? 3 : 8,
            );
            const x = index * (width / chart.data.length) + 12;
            const y = datum.value >= 0 ? zeroY - barHeight : zeroY;

            return (
              <g key={datum.id}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={toneHex(datum.tone)}
                />
                <text
                  x={x + barWidth / 2}
                  y={datum.value >= 0 ? y - 8 : y + barHeight + 16}
                  fill="#d4d4d8"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {formatSignedNumber(datum.value)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  fill="#71717a"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {datum.label.replace(" ", "\n")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function KpiBand({ report }: { report: TraderAnalyticsReport }) {
  const commonFocus = report.primaryFocusCounts[0];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <KpiCard
        label="Total Gross P/L"
        value={formatSignedNumber(report.pnl.grossTotalRealizedPnl)}
        detail="commissions excluded"
        tone={
          report.pnl.grossTotalRealizedPnl > 0
            ? "positive"
            : report.pnl.grossTotalRealizedPnl < 0
              ? "negative"
              : "neutral"
        }
      />
      <KpiCard
        label="Gross Win Rate"
        value={formatPercent(report.pnl.grossWinRate)}
        detail={`${report.pnl.grossWinnerCount} winners`}
        tone="info"
      />
      <KpiCard
        label="Completed"
        value={String(report.sampleSize.completedTradeCount)}
        detail={`${report.sampleSize.failedTradeCount} failed`}
        tone="neutral"
      />
      <KpiCard
        label="Primary Focus"
        value={commonFocus ? String(commonFocus.count) : "0"}
        detail={commonFocus?.label ?? "None"}
        tone={commonFocus?.kind === "risk" ? "warning" : "positive"}
      />
      <KpiCard
        label="Adverse Add Rate"
        value={formatPercent(report.executionBehavior.adversePriceAddRate)}
        detail={`${report.executionBehavior.adversePriceAddTradeCount} trades`}
        tone="warning"
      />
      <KpiCard
        label="Open Rate"
        value={formatPercent(report.lifecycle.openPositionRate)}
        detail={`${report.lifecycle.openPositionTradeCount} left open`}
        tone="accent"
      />
    </section>
  );
}

function TradeTable({ trades }: { trades: TraderAnalyticsTradeRow[] }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Trade Rows</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="border-b border-zinc-800 text-zinc-500">
            <tr>
              <th className="py-3 pr-4 font-medium">Trade</th>
              <th className="py-3 pr-4 font-medium">Direction</th>
              <th className="py-3 pr-4 font-medium">Session</th>
              <th className="py-3 pr-4 font-medium">Gross P/L</th>
              <th className="py-3 pr-4 font-medium">Primary</th>
              <th className="py-3 pr-4 font-medium">Top Risk</th>
              <th className="py-3 pr-4 font-medium">Top Strength</th>
              <th className="py-3 pr-4 font-medium">Warnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {trades.map((trade) => (
              <tr key={`${trade.requestIndex}-${trade.symbol}`}>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-zinc-100">
                    #{trade.tradeIndex} {trade.symbol}
                  </div>
                  <div className="font-mono text-zinc-500">
                    {trade.executionCount} executions
                  </div>
                </td>
                <td className="py-3 pr-4 text-zinc-300">
                  {trade.tradeDirection}
                </td>
                <td className="py-3 pr-4 text-zinc-400">
                  <div>{trade.sessionDate}</div>
                  <div className="font-mono text-zinc-500">
                    {trade.sessionBucket}
                  </div>
                </td>
                <td
                  className={`py-3 pr-4 font-mono ${
                    trade.grossRealizedPnl >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {formatSignedNumber(trade.grossRealizedPnl)}
                </td>
                <td className="max-w-[180px] py-3 pr-4 text-zinc-300">
                  {trade.primaryFocus?.label ?? "None"}
                </td>
                <td className="max-w-[180px] py-3 pr-4 text-amber-300">
                  {trade.topRisk?.label ?? "None"}
                </td>
                <td className="max-w-[180px] py-3 pr-4 text-emerald-300">
                  {trade.topStrength?.label ?? "None"}
                </td>
                <td className="max-w-[220px] py-3 pr-4 text-zinc-500">
                  {trade.warnings.length > 0 ? trade.warnings.join("; ") : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportView({ report }: { report: TraderAnalyticsReport }) {
  const rawJson = JSON.stringify(report, null, 2);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Generated
            </div>
            <div className="mt-1 font-mono text-sm text-zinc-300">
              {report.generatedAt}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Requests
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {report.sampleSize.requestCount} requested /{" "}
              {report.sampleSize.completedTradeCount} completed
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Symbols
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {report.sampleSize.symbols.join(", ") || "None"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Source
            </div>
            <div className="mt-1 font-mono text-sm text-zinc-300">
              {report.inputMode}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-zinc-500 md:grid-cols-2">
          {report.limitations.map((limitation) => (
            <div key={limitation} className="border-l border-zinc-800 pl-3">
              {limitation}
            </div>
          ))}
        </div>
      </section>

      <KpiBand report={report} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <GrossPnlSeries chart={report.charts.grossPnlByTrade} />
        <DonutChart chart={report.charts.winLossDonut} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <HorizontalBarChart chart={report.charts.topRisksBar} />
        <HorizontalBarChart chart={report.charts.primaryFocusDistribution} />
        <HorizontalBarChart chart={report.charts.behaviorRiskRates} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <HorizontalBarChart chart={report.charts.topStrengthsBar} />
        <DistributionBar chart={report.charts.riskCategoryDistribution} />
        <DistributionBar chart={report.charts.strengthCategoryDistribution} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <HorizontalBarChart chart={report.charts.durationHistogram} />
        <DonutChart chart={report.charts.openClosedDonut} />
      </section>

      <TradeTable trades={report.trades} />

      {report.warnings.length > 0 ? (
        <section className="border border-amber-900 bg-amber-950/30 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Warnings</h2>
          <div className="mt-3 grid gap-2 text-sm text-amber-100">
            {report.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </section>
      ) : null}

      <details className="border border-zinc-800 bg-zinc-950 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
          Debug Raw JSON
        </summary>
        <pre className="mt-4 max-h-[520px] overflow-auto bg-zinc-900 p-4 text-xs leading-5 text-zinc-300">
          {rawJson}
        </pre>
      </details>
    </div>
  );
}

export function TraderAnalyticsDebugClient({
  initialReport,
  initialRequestText,
}: {
  initialReport: TraderAnalyticsReport;
  initialRequestText: string;
}) {
  const [requestText, setRequestText] = useState(initialRequestText);
  const [apiState, setApiState] = useState<ApiState>({
    status: "success",
    body: initialReport,
    error: null,
  });

  const completedLabel = useMemo(() => {
    if (apiState.status !== "success") {
      return "No report loaded";
    }

    return `${apiState.body.sampleSize.completedTradeCount} completed / ${apiState.body.sampleSize.failedTradeCount} failed`;
  }, [apiState]);

  async function runReport(text: string = requestText) {
    setApiState({ status: "loading", body: null, error: null });

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      setApiState({
        status: "error",
        body: null,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    try {
      const response = await fetch("/api/trader-analytics/debug", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildApiBody(parsed)),
      });
      const body = await response.json();

      if (!response.ok) {
        setApiState({
          status: "error",
          body: null,
          error: body.error?.message ?? "Analytics request failed.",
        });
        return;
      }

      setApiState({
        status: "success",
        body,
        error: null,
      });
    } catch (error) {
      setApiState({
        status: "error",
        body: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function loadSample() {
    setRequestText(initialRequestText);
    setApiState({
      status: "success",
      body: initialReport,
      error: null,
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
              Trader Intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
              Trader Analytics
            </h1>
            <div className="mt-2 text-sm text-zinc-500">{completedLabel}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="h-10 border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:border-sky-400 hover:text-sky-200"
              type="button"
              onClick={loadSample}
            >
              Load Sample
            </button>
            <button
              className="h-10 bg-sky-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              type="button"
              disabled={apiState.status === "loading"}
              onClick={() => void runReport()}
            >
              {apiState.status === "loading" ? "Running" : "Run Report"}
            </button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(360px,0.46fr)_minmax(0,1fr)]">
          <div className="flex min-h-[720px] flex-col">
            <label
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
              htmlFor="trader-analytics-request-json"
            >
              Request JSON
            </label>
            <textarea
              id="trader-analytics-request-json"
              className="min-h-[680px] flex-1 resize-y border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs leading-5 text-zinc-100 outline-none transition focus:border-sky-400"
              spellCheck={false}
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
            />
          </div>

          <div className="min-h-[720px]">
            {apiState.status === "idle" ? (
              <div className="border border-zinc-800 bg-zinc-950 p-8 text-sm text-zinc-500">
                No report loaded.
              </div>
            ) : null}
            {apiState.status === "loading" ? (
              <div className="border border-zinc-800 bg-zinc-950 p-8 text-sm text-zinc-500">
                Running...
              </div>
            ) : null}
            {apiState.status === "error" ? (
              <div className="border border-rose-900 bg-rose-950/30 p-8 text-sm text-rose-200">
                {apiState.error}
              </div>
            ) : null}
            {apiState.status === "success" ? (
              <ReportView report={apiState.body} />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
