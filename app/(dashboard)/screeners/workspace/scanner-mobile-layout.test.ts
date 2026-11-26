import { workspaceVolumeColumns, workspaceVolumeFacts } from "./workspace-volume";
import { livePresetChoices } from "@/src/modules/scanner/custom/built-in-scans";
import { workspaceScannerKind } from "./workspace-scanner-title";
import {expect,it} from 'vitest';
import {defaultMobileLayout,readMobileLayouts,readMobileLayout,moveMobileCard,toggleMobileCard,mobileCardHeight} from '@/app/(dashboard)/screeners/workspace/scanner-mobile-layout';
it('separates all orientation defaults without borrowing desktop coordinates',()=>{const p=defaultMobileLayout('portrait'),l=defaultMobileLayout('landscape');expect(p.columns).toBe(1);expect(l.columns).toBe(2);p.order.reverse();expect(l.order[0]).toBe('gainers');expect(p.heights).toEqual({});});
it('tabs always fills viewport independent of stacked height',()=>{const l=defaultMobileLayout('landscape');l.heights.momentum=.5;expect(mobileCardHeight(l,'momentum',612,true)).toBe(612);expect(mobileCardHeight(l,'momentum',612,false)).toBe(306);expect(mobileCardHeight(l,'gainers',612,false)).toBe(612);});
it('reorders without mutating and adds hidden cards without desktop collision limits',()=>{const l=defaultMobileLayout('portrait');const n=moveMobileCard(l,'ticker-workspace','gainers');expect(n.order[0]).toBe('ticker-workspace');expect(l.order[0]).toBe('gainers');let t=toggleMobileCard(l,'gainers');expect(t.order).not.toContain('gainers');t=toggleMobileCard(t,'gainers');expect(t.order.at(-1)).toBe('gainers');expect(toggleMobileCard({...l,order:['gainers']},'gainers').order).toEqual(['gainers']);});
it('keeps named layouts and valid lanes on reload while rejecting corrupt heights',()=>{const p=defaultMobileLayout('portrait'),l=defaultMobileLayout('landscape');p.heights.gainers=.7;l.columns=1;l.wide=['momentum'];const value=readMobileLayouts({portrait:{active:'Phone',layouts:[{name:'Phone',layout:p}]},landscape:{active:'Wide',layouts:[{name:'Wide',layout:l}]}});expect(value.portrait.layouts[0].layout.heights.gainers).toBe(.7);expect(value.landscape.layouts[0].layout.columns).toBe(1);for(const bad of [NaN,Infinity,.1,9])expect(()=>readMobileLayout({...p,heights:{gainers:bad}},'portrait')).toThrow();});
it('preserves scanner assignments and independent card display modes',()=>{const l=defaultMobileLayout('landscape');l.views={gainers:'table',momentum:'two-rows'};expect(readMobileLayout(JSON.parse(JSON.stringify(l)),'landscape').views).toEqual(l.views);});

it('remembers explicit landscape columns independently from full-width and portrait',()=>{const l=defaultMobileLayout('landscape');l.placement={gainers:2,momentum:1};l.wide=['ticker-workspace'];const saved=readMobileLayout(JSON.parse(JSON.stringify(l)),'landscape');expect(saved.placement).toEqual({gainers:2,momentum:1});expect(saved.wide).toEqual(['ticker-workspace']);expect(defaultMobileLayout('portrait').placement).toBeUndefined();});

it("round-trips the same saved scan with independent card modes and sections", () => {
  const id = "abcde000-1234-5678-9abc-abcde0000000";
  const portrait = defaultMobileLayout("portrait");
  const layout = readMobileLayout(JSON.parse(JSON.stringify({
    ...portrait,
    savedScanIds: { gainers: id, momentum: id, "high-drops": "invalid" },
    views: { gainers: "table", momentum: "two-rows" },
    sections: { gainers: [], momentum: ["catalyst", "stats", "catalyst", "invalid"] },
  })), "portrait");

  expect(layout.savedScanIds).toEqual({ gainers: id, momentum: id });
  expect(layout.views).toEqual({ gainers: "table", momentum: "two-rows" });
  expect(layout.sections).toEqual({ gainers: [], momentum: ["catalyst", "stats"] });
  expect(defaultMobileLayout("landscape").savedScanIds).toBeUndefined();
});


it("normalizes legacy scanner choices to master IDs while preserving card settings", () => {
  const initial = defaultMobileLayout("portrait");
  const layout = readMobileLayout({
    ...initial,
    scanners: {
      gainers: "top-losers",
      momentum: "high-drops",
      "top-losers": "live:market-events",
      "high-drops": "post-market-gainers",
      breakouts: "built-in:momentum",
      "market-events": "live:breakouts",
    },
    views: { "market-events": "two-rows", gainers: "cards" },
  }, "portrait");
  expect(layout.scanners).toEqual({
    gainers: "live:losers",
    momentum: "live:hod-drops",
    "top-losers": "live:market-events",
    "high-drops": "post-market-gainers",
    "market-events": "live:breakouts",
  });
  expect(layout.views).toEqual({ "market-events": "two-rows", gainers: "cards" });
});

it("restores all six Scanner presets in any slot using the master catalogue", () => {
  const original = defaultMobileLayout("landscape");
  expect(livePresetChoices).toHaveLength(6);
  for (const { id, widget } of livePresetChoices) {
    const layout = readMobileLayout({ ...original, scanners: { gainers: id, "market-events": id } }, "landscape");
    expect(layout.scanners).toEqual({ gainers: id, "market-events": id });
    expect(workspaceScannerKind("gainers", layout.scanners.gainers)).toBe(widget);
    expect(workspaceScannerKind("market-events", layout.scanners["market-events"])).toBe(widget);
  }
  expect(workspaceScannerKind("market-events")).toBe("market-events");
});


it("persists only supported optional volume columns, independently per card", () => {
  const initial = defaultMobileLayout("portrait");
  const layout = readMobileLayout({ ...initial, volumeColumns: {
    gainers: ["postMarketVolume", "dayVolume", "postMarketVolume"],
    momentum: ["regularVolume"], unknown: ["premarketVolume"],
  } }, "portrait");
  expect(layout.volumeColumns).toEqual({ gainers:["postMarketVolume"],momentum:["regularVolume"] });
  expect(workspaceVolumeColumns(true, layout.volumeColumns?.gainers)).toEqual(["postMarketVolume"]);
  expect(workspaceVolumeColumns(false, layout.volumeColumns?.momentum)).toEqual(["dayVolume","regularVolume"]);
  const row = { symbol:"TEST", volume:42, premarketVolume:12, regularVolume:30, postMarketVolume:0 };
  expect(workspaceVolumeFacts(row)).toEqual([
    ["Vol","—"],["Pre Vol","12"],["Regular Vol","30"],["After-hours Vol","0"],
  ]);
});

it("restores two additional scanner cards without changing the seven-card default or duplicating the chart", () => {
  const initial = defaultMobileLayout("portrait");
  expect(initial.order).toHaveLength(7);
  const savedScanId = "abcde000-1234-5678-9abc-abcde0000000";
  const saved = readMobileLayout({
    ...initial,
    order: [...initial.order, "scanner-8", "scanner-9"],
    scanners: { "scanner-8": "momentum" },
    savedScanIds: { "scanner-9": savedScanId },
    selected: "scanner-9",
    views: { "scanner-8": "cards", "scanner-9": "two-rows" },
  }, "portrait");
  expect(saved.order).toHaveLength(9);
  expect(saved.scanners["scanner-8"]).toBe("live:momentum");
  expect(saved.savedScanIds?.["scanner-9"]).toBe(savedScanId);
  expect(saved.selected).toBe("scanner-9");
  expect(saved.mode).toBe("tabs");
  expect(toggleMobileCard(initial, "scanner-8").mode).toBe("tabs");
  expect(toggleMobileCard(toggleMobileCard(initial, "gainers"), "scanner-8").mode).toBe("stacked");
  expect(saved.views).toEqual({ "scanner-8": "cards", "scanner-9": "two-rows" });
  expect(saved.order.filter(widget => widget === "ticker-workspace")).toHaveLength(1);
  expect(() => readMobileLayout({...saved, order: [...initial.order, "ticker-workspace"]}, "portrait")).toThrow();
});
