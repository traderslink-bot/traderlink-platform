import Link from "next/link";
import type { ReactNode } from "react";
import {
  userFacingTradeDirection as productUserFacingTradeDirection,
} from "../src/lib/trader-analytics/product/trade-display-copy";

export type AppTone = "default" | "info" | "success" | "warning" | "danger" | "muted";

const toneText: Record<AppTone, string> = {
  default: "text-zinc-100",
  info: "text-sky-300",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
  muted: "text-zinc-500",
};

const toneBorder: Record<AppTone, string> = {
  default: "border-zinc-800",
  info: "border-sky-800",
  success: "border-emerald-900",
  warning: "border-amber-900",
  danger: "border-rose-900",
  muted: "border-zinc-900",
};

const toneBg: Record<AppTone, string> = {
  default: "bg-zinc-950",
  info: "bg-sky-950/30",
  success: "bg-emerald-950/20",
  warning: "bg-amber-950/20",
  danger: "bg-rose-950/20",
  muted: "bg-zinc-950",
};

function chartToneClass(tone: string | undefined): string {
  if (tone === "positive") {
    return "bg-emerald-400";
  }

  if (tone === "negative") {
    return "bg-rose-400";
  }

  if (tone === "warning") {
    return "bg-amber-400";
  }

  if (tone === "neutral") {
    return "bg-sky-400";
  }

  return "bg-zinc-500";
}

function chartTextClass(tone: string | undefined): string {
  if (tone === "positive") {
    return "text-emerald-300";
  }

  if (tone === "negative") {
    return "text-rose-300";
  }

  if (tone === "warning") {
    return "text-amber-300";
  }

  if (tone === "neutral") {
    return "text-sky-300";
  }

  return "text-zinc-400";
}

export function plainStateLabel(value: string | null | undefined): string {
  switch (value) {
    case "saved_sqlite":
    case "local_sqlite_single_user":
      return "Saved import data";
    case "sample_fallback":
    case "sample_in_memory":
      return "Sample data until you save an import";
    case "market_context_unavailable":
      return "Chart data still missing";
    case "analysis_failed":
      return "Needs technical follow-up";
    case "blocked_open_trade":
      return "Open trade";
    case "completed":
      return "Reviewed with chart data";
    case "queued":
      return "Waiting for review";
    case "skipped_limit":
      return "Waiting for review capacity";
    default:
      return value ? value.replaceAll("_", " ") : "Not available";
  }
}

export function userFacingTradeDirection(value: string | null | undefined): string {
  return productUserFacingTradeDirection(value);
}

export function withPageAnchor(href: string, anchor: string): string {
  const cleanAnchor = anchor.replace(/^#/, "");

  if (href.startsWith("#")) {
    return `#${cleanAnchor}`;
  }

  return `${href.split("#")[0]}#${cleanAnchor}`;
}

export function PlainStateBadge({
  state,
  tone = "muted",
}: {
  state: string | null | undefined;
  tone?: AppTone;
}) {
  return (
    <span
      className={`inline-flex border px-2 py-1 text-xs uppercase tracking-wide ${toneBorder[tone]} ${toneBg[tone]} ${toneText[tone]}`}
    >
      {plainStateLabel(state)}
    </span>
  );
}

export function MetricCard({
  detail,
  label,
  tone = "default",
  value,
}: {
  detail?: ReactNode;
  label: string;
  tone?: AppTone;
  value: ReactNode;
}) {
  return (
    <div className="ti-metric-card min-h-[96px] min-w-0 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-3 break-words text-xl font-semibold leading-7 sm:text-2xl ${toneText[tone]}`}>
        {value}
      </div>
      {detail ? (
        <div className="mt-2 break-words text-xs leading-5 text-zinc-500 sm:text-sm">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function PrimaryActionPanel({
  actionHref,
  actionLabel,
  body,
  eyebrow = "Do This Next",
  secondary,
  testId,
  title,
  tone = "info",
}: {
  actionHref: string;
  actionLabel: string;
  body: ReactNode;
  eyebrow?: string;
  secondary?: ReactNode;
  testId?: string;
  title: ReactNode;
  tone?: AppTone;
}) {
  return (
    <section
      className={`border p-5 ${toneBorder[tone]} ${toneBg[tone]}`}
      data-testid={testId}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${toneText[tone]}`}>
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">{title}</h2>
          <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {body}
          </div>
          {secondary ? <div className="mt-4">{secondary}</div> : null}
        </div>
        <Link
          className={`inline-flex items-center justify-center border px-4 py-3 text-sm font-medium transition hover:border-sky-400 ${toneBorder[tone]} ${toneText[tone]}`}
          href={actionHref}
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}

export function AdvancedDisclosure({
  children,
  summary = "Advanced setup details",
  testId,
}: {
  children: ReactNode;
  summary?: string;
  testId?: string;
}) {
  return (
    <details className="ti-advanced-panel p-4" data-testid={testId}>
      <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
        {summary}
      </summary>
      <div className="mt-5 grid gap-6">{children}</div>
    </details>
  );
}

export type DashboardSideNavItem = {
  href: string;
  label: string;
  summary: string;
};

export function DashboardSideNav({
  eyebrow = "Page Menu",
  items,
  summary = "Jump to the part of this workspace you want to review.",
}: {
  eyebrow?: string;
  items: DashboardSideNavItem[];
  summary?: string;
}) {
  return (
    <>
      <details className="ti-panel p-3 lg:hidden">
        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-100">
          <span className="text-xs uppercase tracking-wide text-sky-300">
            {eyebrow}
          </span>
          <span className="mt-1 block text-sm text-zinc-100">
            Page sections
          </span>
          <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">
            Tap to jump around this page.
          </span>
        </summary>
        <nav
          className="mt-3 grid grid-cols-2 gap-2"
          aria-label={`${eyebrow} mobile`}
        >
          {items.map((item) => (
            <a
              className="rounded-md border border-zinc-800/50 bg-slate-950/30 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-sky-700 hover:text-sky-200"
              href={item.href}
              key={`mobile-${item.href}-${item.label}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </details>

      <aside className="ti-panel hidden h-fit p-3 lg:sticky lg:top-6 lg:block">
        <div className="px-2 py-2">
          <div className="text-xs font-semibold uppercase text-sky-300">
            {eyebrow}
          </div>
          <div className="mt-1 text-xs leading-5 text-zinc-500">{summary}</div>
        </div>
        <nav className="mt-2 grid gap-2" aria-label={eyebrow}>
          {items.map((item) => (
            <a
              className="rounded-md border border-zinc-800/40 px-3 py-3 text-left text-zinc-400 transition hover:border-sky-700 hover:bg-sky-950/30 hover:text-zinc-100"
              href={item.href}
              key={`${item.href}-${item.label}`}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                {item.summary}
              </span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}

export type WorkflowHandoffItem = {
  action: string;
  body: ReactNode;
  href: string;
  label: string;
  title: ReactNode;
  tone?: AppTone;
};

export function WorkflowHandoffPanel({
  body,
  eyebrow = "Workflow",
  items,
  testId,
  title,
}: {
  body: ReactNode;
  eyebrow?: string;
  items: WorkflowHandoffItem[];
  testId?: string;
  title: ReactNode;
}) {
  return (
    <section className="ti-panel p-5" data-testid={testId}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
        <div className="max-w-4xl text-sm leading-6 text-zinc-400">{body}</div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = item.tone ?? "info";

          return (
            <Link
              className={`ti-workflow-step block p-4 transition hover:border-sky-500 ${toneBorder[tone]}`}
              href={item.href}
              key={`${item.label}-${item.href}`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wide ${toneText[tone]}`}>
                {item.label}
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">
                {item.title}
              </div>
              <div className="mt-2 text-xs leading-5 text-zinc-500">
                {item.body}
              </div>
              <div className={`mt-3 text-xs font-semibold ${toneText[tone]}`}>
                {item.action}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export type SimpleChartRow = {
  category?: string;
  id: string;
  label: string;
  pctOfTotal?: number | null;
  tone?: string;
  value: number;
};

export type SimpleChart = {
  data: SimpleChartRow[];
  empty?: boolean;
  id: string;
  title: string;
  total: number;
};

export type TradeVisualRow = {
  id?: string;
  label?: string;
  pnl: number;
  sessionDate?: string;
  symbol?: string;
};

function formatDefaultSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function pnlToneClass(value: number): string {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function pnlBgClass(value: number): string {
  return value >= 0 ? "bg-emerald-400" : "bg-rose-400";
}

function buildSparklinePoints(values: number[], width: number, height: number): string {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const step = values.length === 1 ? width : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function EquityCurveChart({
  formatter = formatDefaultSigned,
  rows,
  subtitle,
  title = "P/L Curve",
}: {
  formatter?: (value: number) => string;
  rows: TradeVisualRow[];
  subtitle?: string;
  title?: string;
}) {
  let running = 0;
  const cumulative = rows.map((row) => {
    running += row.pnl;
    return running;
  });
  const points = buildSparklinePoints(cumulative, 360, 130);
  const positive = running >= 0;

  return (
    <div className="ti-panel p-5" data-testid="dashboard-equity-curve">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {subtitle ?? "Running gross result across the visible trades."}
          </p>
        </div>
        <div className={`font-mono text-xl font-semibold ${pnlToneClass(running)}`}>
          {formatter(running)}
        </div>
      </div>
      <div className="mt-5 h-[170px] rounded-md border border-zinc-700/70 bg-slate-900/70 p-4">
        {points ? (
          <svg
            aria-label={title}
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 360 130"
          >
            <defs>
              <linearGradient id="equity-fill" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={positive ? "#34d399" : "#fb7185"}
                  stopOpacity="0.24"
                />
                <stop
                  offset="100%"
                  stopColor={positive ? "#34d399" : "#fb7185"}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <line
              stroke="#374151"
              strokeDasharray="4 5"
              strokeWidth="1"
              x1="0"
              x2="360"
              y1="95"
              y2="95"
            />
            <polyline
              fill="none"
              points={points}
              stroke={positive ? "#34d399" : "#fb7185"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            <polyline
              fill="none"
              opacity="0.28"
              points={points}
              stroke={positive ? "#6ee7b7" : "#fda4af"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="10"
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Save trades to draw the P/L curve.
          </div>
        )}
      </div>
    </div>
  );
}

export function OutcomeDonut({
  flat,
  losses,
  title = "Win/Loss Mix",
  wins,
}: {
  flat: number;
  losses: number;
  title?: string;
  wins: number;
}) {
  const total = Math.max(wins + losses + flat, 1);
  const winPct = Math.round((wins / total) * 100);
  const lossPct = Math.round((losses / total) * 100);
  const flatPct = Math.max(0, 100 - winPct - lossPct);
  const background = `conic-gradient(#34d399 0 ${winPct}%, #fb7185 ${winPct}% ${
    winPct + lossPct
  }%, #71717a ${winPct + lossPct}% 100%)`;

  return (
    <div className="ti-panel p-5" data-testid="dashboard-outcome-donut">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <div className="mt-5 grid grid-cols-[112px_1fr] items-center gap-5">
        <div
          aria-label={`${winPct}% winners, ${lossPct}% losers`}
          className="relative h-28 w-28 rounded-full border border-zinc-700"
          style={{ background }}
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-slate-900/90">
            <span className="font-mono text-2xl font-semibold text-zinc-50">
              {winPct}%
            </span>
            <span className="text-xs text-zinc-500">wins</span>
          </div>
        </div>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Winners</span>
            <span className="font-mono text-emerald-300">{wins}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Losers</span>
            <span className="font-mono text-rose-300">{losses}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Flat</span>
            <span className="font-mono text-zinc-300">{flatPct > 0 ? flat : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PnlCalendarGrid({
  formatter = formatDefaultSigned,
  rows,
  title = "P/L Calendar",
}: {
  formatter?: (value: number) => string;
  rows: TradeVisualRow[];
  title?: string;
}) {
  const byDate = new Map<string, { count: number; pnl: number }>();

  rows.forEach((row) => {
    const key = row.sessionDate ?? "No date";
    const current = byDate.get(key) ?? { count: 0, pnl: 0 };
    byDate.set(key, { count: current.count + 1, pnl: current.pnl + row.pnl });
  });

  const days = [...byDate.entries()].slice(-18);

  return (
    <div className="ti-panel p-5" data-testid="dashboard-pnl-calendar">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-500">{days.length} trading days</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {days.length === 0 ? (
          <div className="col-span-full text-sm text-zinc-500">
            Save trades to build a calendar.
          </div>
        ) : (
          days.map(([date, day]) => (
            <div
              className={`min-h-[76px] rounded-md border p-3 ${
                day.pnl >= 0
                  ? "border-emerald-900/70 bg-emerald-950/30"
                  : "border-rose-900/70 bg-rose-950/30"
              }`}
              key={date}
            >
              <div className="text-xs text-zinc-400">{date.slice(5)}</div>
              <div className={`mt-2 font-mono text-sm font-semibold ${pnlToneClass(day.pnl)}`}>
                {formatter(day.pnl)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {day.count} trade{day.count === 1 ? "" : "s"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TradeOutcomeTape({
  formatter = formatDefaultSigned,
  rows,
  title = "Trade Tape",
}: {
  formatter?: (value: number) => string;
  rows: TradeVisualRow[];
  title?: string;
}) {
  const visibleRows = rows.slice(-12);
  const max = Math.max(1, ...visibleRows.map((row) => Math.abs(row.pnl)));

  return (
    <div className="ti-panel p-5" data-testid="dashboard-trade-tape">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-500">latest {visibleRows.length}</span>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleRows.map((row, index) => (
          <div
            className="grid grid-cols-[72px_1fr_92px] items-center gap-3 text-sm"
            key={row.id ?? `${row.symbol}-${index}`}
          >
            <span className="truncate font-medium text-zinc-300">
              {row.symbol ?? row.label ?? `Trade ${index + 1}`}
            </span>
            <span className="h-2 rounded-full bg-zinc-800">
              <span
                className={`block h-2 rounded-full ${pnlBgClass(row.pnl)}`}
                style={{ width: `${Math.max((Math.abs(row.pnl) / max) * 100, 4)}%` }}
              />
            </span>
            <span className={`text-right font-mono ${pnlToneClass(row.pnl)}`}>
              {formatter(row.pnl)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleBarChart({
  chart,
  formatter,
  maxItems = 6,
  title,
}: {
  chart: SimpleChart;
  formatter: (value: number) => string;
  maxItems?: number;
  title?: string;
}) {
  const rows = chart.data.slice(0, maxItems);
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));

  return (
    <div
      className="ti-chart-card p-4"
      data-testid={`analytics-chart-${chart.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-100">{title ?? chart.title}</h3>
        <span className="font-mono text-xs text-zinc-500">
          {chart.empty ? "no data" : `${chart.total.toFixed(0)} total`}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <div className="text-sm text-zinc-500">No chart data yet.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-zinc-300">{row.label}</span>
                <span className={`font-mono ${chartTextClass(row.tone)}`}>
                  {formatter(row.value)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900/80">
                <div
                  className={`h-2 rounded-full ${chartToneClass(row.tone)}`}
                  style={{ width: `${Math.max((Math.abs(row.value) / max) * 100, 3)}%` }}
                />
              </div>
              {row.category ? (
                <div className="text-xs text-zinc-600">{row.category}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function MixBar({
  chart,
  title,
}: {
  chart: SimpleChart;
  title?: string;
}) {
  const rows = chart.data.filter((row) => row.value > 0);

  return (
    <div
      className="ti-chart-card p-4"
      data-testid={`analytics-chart-${chart.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-100">{title ?? chart.title}</h3>
        <span className="font-mono text-xs text-zinc-500">
          {chart.total.toFixed(0)} trades
        </span>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-900/80">
        {rows.map((row) => (
          <div
            className={chartToneClass(row.tone)}
            key={row.id}
            style={{ width: `${Math.max((row.pctOfTotal ?? 0) * 100, 4)}%` }}
            title={`${row.label}: ${row.value}`}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        {chart.data.map((row) => (
          <div
            className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2 text-sm"
            key={row.id}
          >
            <span className="text-zinc-300">{row.label}</span>
            <span className={`font-mono ${chartTextClass(row.tone)}`}>
              {row.value} {row.pctOfTotal === null || row.pctOfTotal === undefined
                ? ""
                : `(${Math.round(row.pctOfTotal * 100)}%)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
