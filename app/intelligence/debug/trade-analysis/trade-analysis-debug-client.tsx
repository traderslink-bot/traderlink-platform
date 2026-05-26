"use client";

import { useMemo, useState } from "react";

const SAMPLE_REQUEST = {
  symbol: "ABCD",
  tradeDirection: "long",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  provider: {
    preferredProvider: "stub",
    asOfTimestamp: "2026-05-01T15:45:00.000Z",
  },
  tradeWindow: {
    timeframe: "1m",
    preTradeMinutes: 60,
    postTradeMinutes: 60,
  },
  executions: [
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:35:00.000Z",
      side: "buy",
      shares: 100,
      price: 10,
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T14:20:00.000Z",
      side: "sell",
      shares: 100,
      price: 10.5,
    },
  ],
};

type DebugItem = {
  requestIndex: number;
  status: string;
  symbol: string | null;
  failure: {
    code: string;
    title: string;
    userAction: string;
  } | null;
  validation: {
    valid: boolean;
    issues: Array<{
      severity: string;
      code: string;
      path: string;
      message: string;
    }>;
  };
  summary: {
    candleSource: string;
    supportResistance: {
      supportCount: number;
      resistanceCount: number;
      dynamicLevels: {
        vwap: number | null;
        ema9: number | null;
        ema20: number | null;
      };
    };
    marketStructure: {
      observed: boolean;
      state: string | null;
      trendDirection: string | null;
      confidenceLabel: string | null;
      usedForScoring: false;
      diagnosticCodes: string[];
    };
    patterns: {
      detectedCount: number;
      normalizedCount: number;
      topAnchorPattern: {
        patternId: string;
        family: string;
      } | null;
    };
    warnings: string[];
  } | null;
};

type DebugBatchResponse = {
  contractVersion: "batch_trade_analysis_v1";
  source: string;
  generatedAt: string;
  validateOnly: boolean;
  totals: {
    requests: number;
    validated: number;
    completed: number;
    failed: number;
    warnings: number;
  };
  failureCounts: Record<string, number>;
  marketStructureCounts: {
    observed: number;
    missing: number;
    scoringUses: number;
  };
  patternCounts: {
    detectedTotal: number;
    normalizedTotal: number;
    topAnchorPatternIds: Record<string, number>;
  };
  items: DebugItem[];
};

type ApiState =
  | { status: "idle"; body: null; error: null }
  | { status: "loading"; body: null; error: null }
  | { status: "success"; body: DebugBatchResponse; error: null }
  | { status: "error"; body: null; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildApiBody(document: unknown, validateOnly: boolean): unknown {
  if (Array.isArray(document)) {
    return {
      validateOnly,
      requests: document,
    };
  }

  if (
    isRecord(document) &&
    ("request" in document || "trade" in document || "requests" in document || "trades" in document)
  ) {
    return {
      ...document,
      validateOnly,
    };
  }

  return {
    validateOnly,
    request: document,
  };
}

function formatNumber(value: number | null): string {
  return typeof value === "number" ? value.toFixed(4) : "n/a";
}

function statusClassName(status: string): string {
  if (status === "completed") {
    return "border-emerald-700 bg-emerald-950 text-emerald-100";
  }

  if (status === "failed") {
    return "border-red-700 bg-red-950 text-red-100";
  }

  return "border-sky-700 bg-sky-950 text-sky-100";
}

function ResultItem({ item }: { item: DebugItem }) {
  return (
    <div className="border-t border-zinc-800 py-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-zinc-500">
          #{item.requestIndex}
        </span>
        <span className="text-sm font-semibold text-zinc-100">
          {item.symbol ?? "UNKNOWN"}
        </span>
        <span
          className={`rounded-sm border px-2 py-1 text-xs font-medium ${statusClassName(item.status)}`}
        >
          {item.status}
        </span>
        <span className="text-xs text-zinc-500">
          validation {item.validation.valid ? "valid" : "invalid"}
        </span>
      </div>

      {item.validation.issues.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Severity</th>
                <th className="py-2 pr-4 font-medium">Code</th>
                <th className="py-2 pr-4 font-medium">Path</th>
                <th className="py-2 pr-4 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {item.validation.issues.map((issue, index) => (
                <tr key={`${issue.code}-${index}`}>
                  <td className="py-2 pr-4 uppercase text-zinc-300">
                    {issue.severity}
                  </td>
                  <td className="py-2 pr-4 font-mono text-zinc-300">
                    {issue.code}
                  </td>
                  <td className="py-2 pr-4 font-mono text-zinc-500">
                    {issue.path || "(root)"}
                  </td>
                  <td className="py-2 pr-4 text-zinc-400">
                    {issue.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {item.failure ? (
        <div className="mt-4 border-l-2 border-red-600 pl-4 text-sm">
          <div className="font-mono text-xs text-red-300">
            {item.failure.code}
          </div>
          <div className="mt-1 font-medium text-zinc-100">
            {item.failure.title}
          </div>
          <div className="mt-1 text-zinc-400">{item.failure.userAction}</div>
        </div>
      ) : null}

      {item.summary ? (
        <div className="mt-4 grid gap-4 text-sm lg:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-600">
              Levels
            </div>
            <div className="mt-1 text-zinc-100">
              {item.summary.supportResistance.supportCount} support /{" "}
              {item.summary.supportResistance.resistanceCount} resistance
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-600">
              Dynamic
            </div>
            <div className="mt-1 text-zinc-100">
              VWAP {formatNumber(item.summary.supportResistance.dynamicLevels.vwap)}
            </div>
            <div className="text-zinc-500">
              EMA9 {formatNumber(item.summary.supportResistance.dynamicLevels.ema9)}
              {" / "}EMA20{" "}
              {formatNumber(item.summary.supportResistance.dynamicLevels.ema20)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-600">
              Structure
            </div>
            <div className="mt-1 text-zinc-100">
              {item.summary.marketStructure.observed
                ? `${item.summary.marketStructure.state} / ${item.summary.marketStructure.trendDirection}`
                : "missing"}
            </div>
            <div className="text-zinc-500">
              {item.summary.marketStructure.confidenceLabel ?? "n/a"} confidence
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-600">
              Patterns
            </div>
            <div className="mt-1 text-zinc-100">
              {item.summary.patterns.detectedCount} detected /{" "}
              {item.summary.patterns.normalizedCount} normalized
            </div>
            <div className="break-all font-mono text-xs text-zinc-500">
              {item.summary.patterns.topAnchorPattern?.patternId ?? "no anchor"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TradeAnalysisDebugClient() {
  const [requestText, setRequestText] = useState(
    JSON.stringify(SAMPLE_REQUEST, null, 2),
  );
  const [validateOnly, setValidateOnly] = useState(true);
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
    body: null,
    error: null,
  });

  const rawJson = useMemo(() => {
    if (apiState.status !== "success") {
      return "";
    }

    return JSON.stringify(apiState.body, null, 2);
  }, [apiState]);

  async function submitRequest() {
    setApiState({ status: "loading", body: null, error: null });

    let parsed: unknown;

    try {
      parsed = JSON.parse(requestText);
    } catch (error) {
      setApiState({
        status: "error",
        body: null,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    try {
      const response = await fetch("/api/trade-analysis/debug", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildApiBody(parsed, validateOnly)),
      });
      const body = await response.json();

      if (!response.ok) {
        setApiState({
          status: "error",
          body: null,
          error: body.error?.message ?? "Debug request failed.",
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Trader Intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
              Trade Analysis Debug
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                className="h-4 w-4 accent-emerald-500"
                checked={validateOnly}
                type="checkbox"
                onChange={(event) => setValidateOnly(event.target.checked)}
              />
              Validate only
            </label>
            <button
              className="h-10 rounded-sm bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              type="button"
              disabled={apiState.status === "loading"}
              onClick={submitRequest}
            >
              {apiState.status === "loading" ? "Running" : "Run"}
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-h-[620px] flex-col">
            <label
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
              htmlFor="trade-request-json"
            >
              Request JSON
            </label>
            <textarea
              id="trade-request-json"
              className="min-h-[580px] flex-1 resize-y rounded-sm border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs leading-5 text-zinc-100 outline-none transition focus:border-emerald-500"
              spellCheck={false}
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
            />
          </div>

          <div className="min-h-[620px] border border-zinc-800 bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  Result
                </div>
                {apiState.status === "success" ? (
                  <div className="mt-1 text-xs text-zinc-500">
                    {apiState.body.totals.completed} completed /{" "}
                    {apiState.body.totals.failed} failed /{" "}
                    {apiState.body.totals.warnings} warnings
                  </div>
                ) : null}
              </div>
              {apiState.status === "success" ? (
                <div className="text-right text-xs text-zinc-500">
                  <div>{apiState.body.generatedAt}</div>
                  <div>
                    structure scoring uses{" "}
                    {apiState.body.marketStructureCounts.scoringUses}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="max-h-[580px] overflow-auto px-4">
              {apiState.status === "idle" ? (
                <div className="py-12 text-sm text-zinc-500">
                  No run loaded.
                </div>
              ) : null}
              {apiState.status === "loading" ? (
                <div className="py-12 text-sm text-zinc-500">Running...</div>
              ) : null}
              {apiState.status === "error" ? (
                <div className="py-12 text-sm text-red-300">
                  {apiState.error}
                </div>
              ) : null}
              {apiState.status === "success" ? (
                <>
                  {apiState.body.items.map((item) => (
                    <ResultItem key={item.requestIndex} item={item} />
                  ))}
                  <details className="border-t border-zinc-800 py-5">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                      Raw JSON
                    </summary>
                    <pre className="mt-4 overflow-x-auto rounded-sm bg-zinc-900 p-4 text-xs leading-5 text-zinc-300">
                      {rawJson}
                    </pre>
                  </details>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
