"use client";

import { useEffect, useState } from "react";
import { chartJournalAccountHeader, type ChartJournalSession } from "@/src/modules/journal/contracts/journal-chart-contracts";

function mergeById<T extends { id: string }>(earlier: readonly T[], later: readonly T[]): T[] {
  return [...new Map([...earlier, ...later].map((value) => [value.id, value])).values()];
}

export function useChartJournalSession(account: string, symbol: string, day: string, enabled: boolean) {
  const key = `${account}:${symbol}:${day}`;
  const [request, setRequest] = useState({ key, page: 0, revision: 0 });
  const revision = request.revision;
  const page = request.key === key ? request.page : 0;
  const [response, setResponse] = useState<{
    key: string; page: number; revision: number; data?: ChartJournalSession; error?: string;
  }>();

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ symbol, day, page: String(page) });
    void fetch(`/api/platform/journal/chart?${query}`, {
      cache: "no-store", signal: controller.signal, headers: { [chartJournalAccountHeader]: account },
    }).then(async (result) => {
      if (!result.ok) {
        throw Error(result.status === 409 ? "The active Journal account changed. Refresh the page." :
          result.status === 403 ? "Journal access is unavailable for this account." : "Journal could not load.");
      }
      const { session } = await result.json() as { session: ChartJournalSession };
      if (controller.signal.aborted) return;
      setResponse((previous) => ({
        key, page, revision,
        data: page && previous?.key === key && previous.data ? {
          ...session,
          fills: mergeById(previous.data.fills, session.fills),
          trades: mergeById(previous.data.trades, session.trades.map((value) => {
            const earlier = previous.data!.trades.find((trade) => trade.id === value.id);
            if (!earlier) return value;
            return {
              ...earlier,
              closedAt: earlier.closedAt && value.closedAt ? [earlier.closedAt, value.closedAt].sort().at(-1)! : null,
              memberIds: [...new Set([...earlier.memberIds, ...value.memberIds])],
            };
          })),
          items: mergeById(previous.data.items, session.items),
        } : session,
      }));
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResponse((previous) => ({
        key, page, revision, data: page && previous?.key === key ? previous.data : undefined,
        error: error instanceof Error ? error.message : "Journal could not load.",
      }));
    });
    return () => controller.abort();
  }, [account, day, enabled, key, page, revision, symbol]);

  const matches = response?.key === key;
  return {
    session: matches ? response.data : undefined,
    error: matches && response.revision === revision ? response.error : undefined,
    loading: enabled && (!matches || response.revision !== revision || response.page !== page),
    reload: () => setRequest({ key, page: 0, revision: revision + 1 }),
    loadMore: () => setRequest({ key, page: page + 1, revision }),
  };
}
