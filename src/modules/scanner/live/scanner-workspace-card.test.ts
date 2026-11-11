// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";

import { ScannerWorkspaceCard } from "@/app/(dashboard)/screeners/scanner-workspace-card";

it("applies one compact content-padding contract to every workspace card",async()=>{
  const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
  await act(async()=>root.render(createElement(ScannerWorkspaceCard,{slot:"slot-5",widget:"market-events"} as Parameters<typeof ScannerWorkspaceCard>[0],createElement("section",{"data-traderlink-platform-dashboard-card":"panel"},createElement("div",{className:"MuiCardContent-root"},"Events")))));
  const card=container.querySelector('[data-scanner-workspace-card="market-events"]')!;
  const content=card.querySelector(".MuiCardContent-root")!;
  expect(card.getAttribute("data-scanner-workspace-slot")).toBe("slot-5");
  expect(getComputedStyle(content).padding).toBe("10px");
  await act(async()=>root.unmount());container.remove();
});

it("shows Confirmed first and reveals Early signals on demand", async () => {
  const { MomentumSections } = await import("@/app/(dashboard)/screeners/momentum-sections");
  const { momentumSignalText } = await import("@/app/(dashboard)/screeners/momentum-signal-text");
  type Row = import("./contracts").LiveScannerRow;
  const early: Row = {
    symbol:"EARLY", exchange:"NASDAQ", company:"Example", price:2, sessionGain:4, volume:100_000,
    dollarVolume:200_000, marketCap:10_000_000, marketCapAtCollection:10_000_000, float:null,
    relativeVolume:null, dayHigh:2, dayLow:1.9, offHighPercent:0, floatRetrievedAtUtc:null, spreadPercent:null,
    providerAtUtc:"2026-11-11T15:00:15Z", receivedAtUtc:"2026-11-11T15:00:15Z", reasons:[], news:[],
    activity:{oneMinuteGain:2,fiveMinuteGain:null,oneMinuteVolume:null,oneMinuteDollarVolume:null,
      fiveMinuteVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null},
    momentumHit:{number:2,startedAtUtc:"2026-11-11T15:00:00Z",tier:"early",signals:["one_minute_momentum"]},
  };
  const confirmed: Row = { ...early,symbol:"CONF",momentumHit:{...early.momentumHit!,number:3,
    tier:"confirmed",signals:["price_burst","building_volume"]} };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(MomentumSections,{
      sections:{confirmed:[confirmed],early:[early],confirmedTotal:1,earlyTotal:1},
      renderResults:rows=>rows.map(row=>createElement("p",{key:row.symbol},row.symbol+" "+momentumSignalText(row))),
    })));
    expect(container.textContent).toContain("CONF Price burst + Building volume · 15s ago · Hit 3");
    expect(container.textContent).not.toContain("EARLY 1min");
    const disclosure = container.querySelector("button")!;
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    await act(async () => disclosure.click());
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("EARLY 1min momentum · 15s ago · Hit 2");
    await act(async () => disclosure.click());
    expect(container.textContent).not.toContain("EARLY 1min");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
