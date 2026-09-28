"use client";

import { type ComponentProps, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import dynamic from "next/dynamic";
import type { WatchlistDailyRecapsAdminPanel } from "./watchlist-daily-recaps-admin-panel";
import type { WatchlistUsageAdminPanel } from "./watchlist-usage-admin-panel";

const UsagePanel = dynamic(() => import("./watchlist-usage-admin-panel").then(module => module.WatchlistUsageAdminPanel), {
  loading: () => <p role="status">Loading Usage…</p>,
});
const RecapsPanel = dynamic(() => import("./watchlist-daily-recaps-admin-panel").then(module => module.WatchlistDailyRecapsAdminPanel), {
  loading: () => <p role="status">Loading Daily Recaps…</p>,
});
type RecapsProps = ComponentProps<typeof WatchlistDailyRecapsAdminPanel>;
type RecapsResponse = {
  finalItems: RecapsProps["initialFinalItems"];
  finalDraft: RecapsProps["initialFinalDraft"];
  candidates: RecapsProps["initialCandidates"];
  storage: RecapsProps["initialStorage"];
  posts: RecapsProps["initialPosts"];
};
type PanelData = { section: "usage"; usage: ComponentProps<typeof WatchlistUsageAdminPanel>["usage"] }
  | { section: "recaps"; snapshot: RecapsResponse };

function currentNewYorkDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/New_York",
  }).formatToParts(new Date());
  const part = (name: string) => parts.find(value => value.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Mounted only after this section is selected; retained across tab switches. */
export function WatchlistDeferredAdminPanel({ section }: { section: "usage" | "recaps" }) {
  const [date] = useState(currentNewYorkDate);
  const [data, setData] = useState<PanelData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let active = true;
    const url = section === "usage" ? "/api/admin/watchlist/usage"
      : `/api/admin/watchlist/daily-recaps?date=${encodeURIComponent(date)}`;
    void fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("section_unavailable");
        const result = await response.json();
        if (section === "usage") {
          if (!result.usage) throw new Error("usage_unavailable");
          if (active) setData({ section, usage: result.usage });
        } else {
          if (!Array.isArray(result.candidates) || !Array.isArray(result.finalItems) || !Array.isArray(result.posts)) {
            throw new Error("recaps_unavailable");
          }
          if (active) setData({ section, snapshot: result });
        }
      })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [section, date, attempt]);
  if (failed) return <Alert severity="error" action={<Button color="inherit" onClick={() => {
    setFailed(false); setAttempt(value => value + 1);
  }}>Try again</Button>}>Could not load {section === "usage" ? "Usage" : "Daily Recaps"}.</Alert>;
  if (!data) return <p role="status">Loading {section === "usage" ? "Usage" : "Daily Recaps"}…</p>;
  if (data.section === "usage") return <UsagePanel usage={data.usage} />;
  const snapshot = data.snapshot;
  return <RecapsPanel initialDate={date} initialFinalItems={snapshot.finalItems} initialFinalDraft={snapshot.finalDraft}
    initialCandidates={snapshot.candidates} initialStorage={snapshot.storage} initialPosts={snapshot.posts} />;
}
