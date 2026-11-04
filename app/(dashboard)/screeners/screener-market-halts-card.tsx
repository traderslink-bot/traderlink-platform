"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { DashboardPanel } from "@/app/dashboard-template";
import type { MarketHaltDashboardReadModel } from "@/src/modules/news/contracts/market-halt-dashboard-contracts";

const REFRESH_MS = 60_000;

function shortTime(value: string | null): string {
  if (!value) return "Pending";
  const [hour = "", minute = ""] = value.split(":");
  return hour && minute ? `${hour}:${minute}` : value;
}

export function ScreenerMarketHaltsCard() {
  const [model, setModel] = useState<MarketHaltDashboardReadModel | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/market-halts/current", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw Error("market_halts_unavailable");
        setModel(await response.json() as MarketHaltDashboardReadModel);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => void load(), REFRESH_MS);
      }
    };
    void load();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <DashboardPanel title="Halt Alerts">
    {!model && !unavailable ? <Skeleton height={120} variant="rounded" /> : null}
    {unavailable && !model ? <Typography color="text.secondary" variant="body2">Halt data is temporarily unavailable.</Typography> : null}
    {model && !model.rows.length ? <Typography color="text.secondary" variant="body2">No qualifying Nasdaq or NYSE halts today.</Typography> : null}
    {model?.rows.length ? <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
      {model.rows.slice(0, 12).map((halt) => <Box key={halt.id} sx={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr) auto", columnGap: 1, py: 0.75 }}>
        <Box>
          <Typography sx={{ color: "warning.main", fontSize: "0.78rem", fontWeight: 850, lineHeight: 1.2 }}>{halt.ticker}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.64rem" }}>{shortTime(halt.haltTimeEt)} ET</Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: "0.75rem", fontWeight: 750, lineHeight: 1.2 }} title={`${halt.reason} (${halt.reasonCode})`}>{halt.reason}</Typography>
          <Typography color="text.secondary" noWrap sx={{ fontSize: "0.66rem", mt: 0.2 }}>{halt.market} · {halt.reasonCode}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography color={halt.tradeTimeEt ? "success.main" : "text.secondary"} sx={{ fontSize: "0.68rem", fontWeight: 750 }}>{shortTime(halt.tradeTimeEt)}</Typography>
          <Link href={halt.sourceUrl} rel="noreferrer" sx={{ fontSize: "0.62rem" }} target="_blank">{halt.source === "nasdaq" ? "Nasdaq" : "NYSE"}</Link>
        </Box>
      </Box>)}
    </Stack> : null}
  </DashboardPanel>;
}
