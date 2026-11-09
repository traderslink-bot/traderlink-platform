import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/link",()=>({default:({children,href}:{children:React.ReactNode;href:string})=>createElement("a",{href},children)}));
import { WatchlistV2PotentialPathCard } from "@/app/watchlist/potential-path-levels-card";

const checkedAt=Date.parse("2026-11-09T03:00:00Z");
const symbol={symbol:"TEST",latestPrice:2.5,updatedAt:checkedAt,marketDataStatus:"live",cards:{},
  levelMap:{referencePrice:2,overnightReference:{price:2,checkedAt,resumeAfter:Date.parse("2026-11-09T09:00:00Z")},
    supportLevels:[],resistanceLevels:[],nearestSupport:null,nearestResistance:null,nextStrongSupport:null,nextStrongResistance:null},
} as unknown as ComponentProps<typeof WatchlistV2PotentialPathCard>["symbol"];

it("a confirmed live trade is not hidden by an older overnight reference",()=>{
  const html=renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard,{symbol,livePriceAvailable:true}));
  expect(html).toContain("2.50");expect(html).not.toContain("Not live");
  expect(html).not.toContain("Levels use this fixed price");expect(html).not.toContain("delayed 15 sec");
});
it("an unavailable live trade retains the honestly marked fixed reference",()=>{
  const html=renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard,{symbol,livePriceAvailable:false}));
  expect(html).toContain("2.00");expect(html).toContain("Not live · Price time unavailable");
  expect(html).toContain("until a newer live price arrives");
});
it("a dated BOATS reference displays the actual trade time rather than its later lookup time",()=>{
  const dated={...symbol,levelMap:{...symbol.levelMap!,overnightReference:{...symbol.levelMap!.overnightReference!,observedAt:checkedAt-600000}}};
  const html=renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard,{symbol:dated,livePriceAvailable:false}));
  expect(html).toContain("Not live · Last price: Nov 8, 9:50 PM ET");
});

it("does not call a fixed reference Not live when the feed is connected", () => {
  const html=renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard,{symbol,livePriceAvailable:false,liveFeedConnected:true}));
  expect(html).not.toContain("Not live");
  expect(html).toContain("Levels use this fixed price");
});
