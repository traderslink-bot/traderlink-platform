// @vitest-environment jsdom
import { ScannerTickerDetails } from "../scanner-ticker-details";
import { brokerWorkspaceSavedResults } from "@/src/modules/market-data/workspace-broker-rows";
import type { WorkspaceSavedEntry } from "./broker-workspace-data";
import type { OptionalVolumeColumn } from "./workspace-volume";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { SavedScanResults, ScanResultColumn } from "@/src/modules/scanner/custom/definition";
import { WorkspaceCardSections } from "./scanner-stock-cards";
import { WorkspaceSavedScanCard } from "./workspace-saved-scan-card";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));
vi.mock("../scanner-country-flag", () => ({ ScannerCountryFlag: () => null }));

const columns: ScanResultColumn[] = [
  { metric:"volumePace", label:"5m Volume pace", index:0 },
  { metric:"rollingMove", label:"5m Price move", index:1 },
  { metric:"customEma", label:"5m EMA crossover", index:2, cross:true },
  { metric:"dayHigh", label:"Day high", index:3 },
  { metric:"rollingDollarVolume", label:"5m Dollar volume" },
  { metric:"belowHigh", label:"Below day high", index:9 },
];
const entry: SavedScanResults["results"][string] = {
  state:"ready",
  columns,
  result:{
    status:"open", total:1, eligible:1, incomplete:0, updatedAt:Date.parse("2026-11-18T15:35:00Z"),
    rows:[{
      symbol:"TEST", exchange:"NYSE", price:0.0269, volume:800_000, dollarVolume:24_000,
      marketCap:2_400_000, float:1_000_000, dayChange:-1, belowHigh:null, sortValue:2_500_000,
      matches:[0,-2.75,Date.parse("2026-11-18T15:35:00Z"),0.0277],
    }],
  },
};

function render(view: "table" | "two-rows" | "cards", showStats = true, data: WorkspaceSavedEntry = entry, volumeColumns?: readonly OptionalVolumeColumn[]) {
  const html = renderToStaticMarkup(
    <WorkspaceCardSections.Provider value={{sections:showStats ? ["stats"] : [],update:()=>{},volumeColumns}}>
      <WorkspaceSavedScanCard label="Saved fixture" entry={data} unavailable={false} retrying={false}
        view={view} onViewChange={()=>{}} now={0} onOpenChart={()=>{}}/>
    </WorkspaceCardSections.Provider>
  );
  return new DOMParser().parseFromString(html,"text/html");
}

const values = ["0×","-2.75%","Nov 18, 10:35 AM","$0.0277","$2.5M","—"];

it.each(["table","two-rows"] as const)("projects the authorized descriptors in %s", view => {
  const dom = render(view);
  const labels = [...dom.querySelectorAll("thead th")].map(cell=>cell.textContent);
  const row = [...dom.querySelectorAll("tbody td")].map(cell=>cell.textContent);
  expect(labels).toContain("Dollar vol");
  expect(labels).toContain("Market cap");
  expect(labels.slice(-columns.length)).toEqual(columns.map(column=>column.label));
  expect(row.slice(-columns.length)).toEqual(values);
});

it("uses the same readings inside Cards Stats and respects hidden sections", () => {
  const dom = render("cards");
  const readings = [...dom.querySelectorAll('dl[aria-label="Stats"] dd')].map(value=>value.textContent);
  expect(readings.slice(-columns.length)).toEqual(values);
  expect(render("cards",false).body.textContent).not.toContain("EMA crossover");
});

it("still renders the base row if the compact result has no descriptors", () => {
  const dom = render("table",true,{...entry,columns:undefined});
  expect(dom.querySelector("tbody")?.textContent).toContain("TEST");
  expect(dom.querySelector("thead")?.textContent).not.toContain("EMA crossover");
});

it.each([
  [1, "Some stocks need more data before this scan can check them."],
  [0, "No stocks currently qualify for this scan."],
] as const)("reports an empty open scan with %i incomplete stocks", (incomplete, message) => {
  const dom = render("table", true, {...entry,result:{...entry.result,total:0,incomplete,rows:[]}});
  expect(dom.querySelector('[role="alert"]')?.textContent).toBe(message);
});

it.each(["table","two-rows","cards"] as const)("shows supplied day volume and distinguishes zero from unavailable in %s", view => {
  const row = {...entry.result.rows[0], dayVolume:1_500_000, premarketVolume:null,
    regularVolume:1_200_000, postMarketVolume:0};
  const issued = {...entry,result:{...entry.result,rows:[row]}};
  const dom = render(view,true,issued,["premarketVolume","regularVolume","postMarketVolume"]);
  const labels = [...dom.querySelectorAll(view==="cards"?"dt":"thead th")].map(cell=>cell.textContent);
  const values = [...dom.querySelectorAll(view==="cards"?"dd":"tbody td")].map(cell=>cell.textContent);
  const index = labels.indexOf("Vol");
  expect(index).toBeGreaterThanOrEqual(0);
  expect(labels.slice(index,index+4)).toEqual(["Vol","Pre Vol","Regular Vol","After-hours Vol"]);
  expect(values.slice(index,index+4)).toEqual(["1.5M","—","1.2M","0"]);
  if (view==="cards") expect(values[labels.indexOf("T/O")]).toBe("150%");
  const defaultLabels = [...render(view,true,issued).querySelectorAll(view==="cards"?"dt":"thead th")].map(cell=>cell.textContent);
  expect(defaultLabels).toContain("Vol");
  expect(defaultLabels).not.toContain("Regular Vol");
});

it("does not substitute legacy active-session volume when the issued Day Vol is absent", () => {
  const dom=render("table");
  const labels=[...dom.querySelectorAll("thead th")].map(cell=>cell.textContent);
  const values=[...dom.querySelectorAll("tbody td")].map(cell=>cell.textContent);
  expect(labels).toContain("Vol");
  expect(values[labels.indexOf("Vol")]).toBe("—");
  const cards = render("cards");
  const turnover = [...cards.querySelectorAll("dt")].find(cell=>cell.textContent==="T/O");
  expect(turnover?.nextElementSibling?.textContent).toBe("—");
});

it("renders exact saved-only volume details, including zero and unavailable values", () => {
  const breakdown = {dayVolume:1_200_001,premarketVolume:null,regularVolume:1_200_001,postMarketVolume:0};
  const html = renderToStaticMarkup(<ScannerTickerDetails symbol="TEST" stock={undefined} volumeBreakdown={breakdown}/>);
  const dom = new DOMParser().parseFromString(html,"text/html");
  expect([...dom.querySelectorAll("dt")].map(cell=>cell.textContent)).toEqual(["Day Vol","Pre Vol","Regular Vol","After-hours Vol"]);
  expect([...dom.querySelectorAll("dd")].map(cell=>cell.textContent)).toEqual(["1,200,001","—","1,200,001","0"]);
});

it("keeps quote details ahead of saved-only volume and keeps levels-only output unchanged", () => {
  const quote = {price:2,changePercent:null,dayVolume:2_000_001};
  const breakdown = {dayVolume:1_200_001};
  function contents(levelsOnly: boolean) {
    const html = renderToStaticMarkup(<ScannerTickerDetails symbol="TEST" stock={undefined}
      quote={quote} volumeBreakdown={breakdown} levelsOnly={levelsOnly}/>);
    return new DOMParser().parseFromString(html,"text/html");
  }
  expect(contents(false).querySelector("dl")?.textContent).toContain("2,000,001");
  expect(contents(false).querySelector("dl")?.textContent).not.toContain("1,200,001");
  expect(contents(true).querySelector("dl")).toBeNull();
});

it.each(["table", "two-rows", "cards"] as const)("keeps a saved broker match with no quote in %s", view => {
  const projected = brokerWorkspaceSavedResults({ revision: 1, scans: [], results: { test: entry } }, () => ({}), "regular", 0);
  const dom = render(view, true, projected.results.test);
  expect(dom.body.textContent).toContain("TEST");
  expect(dom.body.textContent).toContain("—");
  expect(dom.body.textContent).not.toContain("$0.0000");
  expect(dom.body.textContent).not.toContain("$0.0269");
});
