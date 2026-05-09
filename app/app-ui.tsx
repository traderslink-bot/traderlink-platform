import Link from "next/link";
import type { ReactNode } from "react";

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
      return "Chart context waiting";
    case "analysis_failed":
      return "Needs technical follow-up";
    case "blocked_open_trade":
      return "Open trade";
    case "completed":
      return "Reviewed with chart context";
    case "queued":
      return "Waiting for review";
    case "skipped_limit":
      return "Waiting for review capacity";
    default:
      return value ? value.replaceAll("_", " ") : "Not available";
  }
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
    <div className="min-h-[112px] border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-semibold ${toneText[tone]}`}>
        {value}
      </div>
      {detail ? <div className="mt-2 text-sm leading-5 text-zinc-500">{detail}</div> : null}
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
    <details className="border border-zinc-900 bg-zinc-950 p-4" data-testid={testId}>
      <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
        {summary}
      </summary>
      <div className="mt-5 grid gap-6">{children}</div>
    </details>
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
      className="border border-zinc-800 bg-zinc-950 p-4"
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
              <div className="h-2 bg-zinc-900">
                <div
                  className={`h-2 ${chartToneClass(row.tone)}`}
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
      className="border border-zinc-800 bg-zinc-950 p-4"
      data-testid={`analytics-chart-${chart.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-100">{title ?? chart.title}</h3>
        <span className="font-mono text-xs text-zinc-500">
          {chart.total.toFixed(0)} trades
        </span>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden bg-zinc-900">
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
