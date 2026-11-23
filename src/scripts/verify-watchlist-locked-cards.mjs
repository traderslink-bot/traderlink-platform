/** Isolated actual-component browser QA. No app server, credentials, providers or delivery. */
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const root = process.cwd();
const out = await mkdtemp(path.join(tmpdir(), "watchlist-locked-cards-"));
const source = await readFile(path.join(root, "src/lib/live-watchlist/__tests__/traderslink-ai-read.test.ts"), "utf8");
const fixture = source.match(/function validBody\(\) \{[\s\S]*?\n\}/)[0];
const read = { ...JSON.parse(vm.runInNewContext(`${fixture};validBody()`)), version: 3, analysisFormat: "simple",
  pullbackPlans: { shallow: null, deep: null }, failureRecovery: null,
  symbol: "SAMPLE", generatedAt: 1795047420000, dataAsOf: 1795047420000,
  simpleAnalysis: { setup: "Momentum advanced above $3.85 on Nov 18.", pullbacks: [
    { low: 3.66, high: 3.72, explanation: "A retest of $3.72 needs a fresh buyer response.", confirmation: "Defend the band and reclaim $3.72.", invalidation: null },
    { low: 3.48, high: 3.51, explanation: "Separate earlier structure around $3.50.", confirmation: "Hold and reclaim $3.51.", invalidation: null }],
    breakout: { price: 4.08, explanation: "The spike high is $4.08.", confirmation: "Hold a retest above $4.08." },
    upside: [{ low: 4.18, high: 4.18, explanation: "Overhead reaction area at $4.18." }, { low: 4.56, high: 4.56, explanation: "A separate daily level at $4.56." }], invalidation: null },
};
await build({ absWorkingDir: root, stdin: { resolveDir: root, loader: "tsx", contents: `
import {createRoot} from 'react-dom/client';
import {WatchlistIndicatorsSample,WatchlistIndicatorsView} from '@/app/watchlist/watchlist-indicators-card';
import {SAMPLE_INDICATORS,SAMPLE_INDICATOR_PRICE} from '@/app/watchlist/watchlist-indicator-sample';
import {WatchlistPotentialPathCardArticle} from '@/app/watchlist/potential-path-levels-card';
import {PremiumAnalysisCard} from '@/app/watchlist/premium-analysis-card';
import {SimpleAnalysisCard} from '@/app/watchlist/simple-analysis-card';
import {PremiumTickerLock} from '@/app/watchlist/premium-ticker-lock';
import {watchlistDetailProjection} from '@/src/lib/live-watchlist/watchlist-member-projection';
const read=${JSON.stringify(read)};
const level=(side,price)=>({side,price,distancePct:(price-3.85)/3.85,label:String(price),strengthLabel:'major',sourceLabel:'daily confluence',marketDataProvenance:{formedAt:Date.parse('2026-10-20T14:30:00Z'),sourceLastSeenAt:1795192200000,lastConfirmedAt:Date.parse('2026-11-20T14:30:00Z')}});
const support=[level('support',3.66),level('support',3.48)],resistance=[level('resistance',4.18),level('resistance',4.56)];
const state={symbol:'SAMPLE',latestPrice:3.85,updatedAt:1795047420000,marketDataStatus:'live',cards:{tradersLinkAiRead:{body:JSON.stringify(read)},fullLadder:{body:'Resistance:\\n4.18\\n4.56\\nSupport:\\n3.66\\n3.48',title:'Full ladder'}},levelMap:{currentPrice:3.85,rangeState:'normal',supportLevels:support,resistanceLevels:resistance,nearestSupport:support[0],nearestResistance:resistance[0],nextStrongSupport:support[1],nextStrongResistance:resistance[1]}};
const app=createRoot(document.getElementById('root'));
window.showCards=(theme,mode)=>{
 document.documentElement.dataset.theme=theme;
 const plans=mode==='plans',locked=mode!=='allowed';
 const projected=watchlistDetailProjection(state,!plans,!locked,!locked,plans?{analysis:'/plans?feature=watchlist.trade_analysis&watchlistTicker=SAMPLE&watchlistControl=analysis',levels:'/plans?feature=watchlist.levels&watchlistTicker=SAMPLE&watchlistControl=levels'}:undefined);
 app.render(<main className="academy-shell" data-academy-theme={theme}><div className="academy-container watchlist-container"><div className="watchlist-card-grid">
 <WatchlistPotentialPathCardArticle symbol={projected} card={projected.cards.nearestSupportResistance??{title:'Potential Path',body:''}} fullLadderCard={projected.cards.fullLadder} showMeta={false} showOuterMeta={false}/>
 {locked?<PremiumAnalysisCard symbol="SAMPLE" preview={projected.premiumAnalysisPreview??{sections:[]}} premium={!plans} upgradeHref={projected.watchlistUpgradeLinks?.analysis}/>:<SimpleAnalysisCard read={read}/>}
 {locked?<WatchlistIndicatorsSample premium={!plans}/>:<WatchlistIndicatorsView current={SAMPLE_INDICATORS} livePrice={SAMPLE_INDICATOR_PRICE}/>}
 <PremiumTickerLock premium={!plans}/>
 </div></div></main>);
};` }, bundle: true, write: true, outfile: path.join(out, "cards.js"), platform: "browser", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}", "process.browser": "true" }, logLevel: "silent" });
const css = await readFile(path.join(out, "cards.css"), "utf8");
const preflight = await readFile(path.join(root, "node_modules/tailwindcss/preflight.css"), "utf8");
const globalCss = (await readFile(path.join(root, "app/globals.css"), "utf8")).replace('@import "tailwindcss";', "");
const js = await readFile(path.join(out, "cards.js"), "utf8");
const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
const receipts = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [], errors = [];
  await page.route("**/*", route => { requests.push(route.request().url()); return route.abort(); });
  page.on("pageerror", e => errors.push(e.message));
  await page.setContent(`<html><head><style>${preflight}\n${globalCss}\n${css}</style></head><body style="margin:0"><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: js });
  assert.deepEqual(errors, [], "Component harness startup");
  for (const [name, width, height] of [["desktop", 1440, 1000], ["portrait", 390, 844], ["landscape", 844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const theme of ["light", "dark"]) for (const mode of ["allowed", "premium", "plans"]) {
      await page.evaluate(({ theme, mode }) => window.showCards(theme, mode), { theme, mode });
      await page.waitForSelector('[data-card-label="Indicators"]');
      await page.waitForTimeout(80);
      const indicators = page.locator('[data-card-label="Indicators"]');
      assert.equal(await indicators.locator("dt").count(), 5);
      assert.equal(await indicators.getByRole("tab").count(), 4);
      const locked = mode !== "allowed";
      assert.equal(await indicators.getAttribute("data-sample"), locked ? "true" : null);
      const levels = page.locator('[data-card-label="Potential Path Levels"]');
      assert.equal(await levels.locator(".watchlist-v2-level-row").count(), 4);
      assert.equal((await levels.innerText()).includes("major / daily confluence"), true);
      if (locked) {
        assert.equal((await levels.innerText()).includes("Oct 20"), false);
        assert.equal((await levels.innerText()).includes("Formed"), true);
        assert.equal((await levels.innerText()).includes("Confirmed"), true);
        const privatePrice = await levels.locator(".watchlist-v2-level-price").first().innerText();
        assert(!/\d/.test(privatePrice));
        const target = page.locator('[data-card-label="TradersLink Analysis"]');
        assert.equal(await target.getByRole("heading", { name: "Potential Targets (Volume Dependent)", exact: true }).count(), 1);
        assert.equal(await target.locator(".watchlist-ai-read-targets li").count(), 2);
        const upgrade = indicators.locator("a");
        assert.equal(await upgrade.getAttribute("target"), mode === "premium" ? "_blank" : null);
        const style = await upgrade.evaluate(el => ({ weight: getComputedStyle(el).fontWeight, decoration: getComputedStyle(el).textDecorationLine, color: getComputedStyle(el).color }));
        assert.equal(style.weight, "700"); assert(style.decoration.includes("underline"));
        assert.equal(style.color, theme === "dark" ? "rgb(251, 146, 60)" : "rgb(180, 83, 9)");
        await indicators.getByRole("tab", { name: "1m", exact: true }).click();
        assert.equal(await indicators.getByRole("tab", { name: "1m", exact: true }).getAttribute("aria-selected"), "true");
        await indicators.getByRole("tab", { name: "1m", exact: true }).press("End");
        assert.equal(await indicators.getByRole("tab", { name: "Daily" }).getAttribute("aria-selected"), "true");
        await indicators.getByRole("button", { name: "About VWAP" }).click();
        await page.getByRole("tooltip").waitFor();
        await indicators.getByRole("button", { name: "About VWAP" }).press("Escape");
        await page.getByRole("tooltip").waitFor({ state: "hidden" });
      }
      if (await levels.locator("details").getAttribute("open") !== null) await levels.locator("summary").click();
      await levels.locator("summary").click();
      assert.equal(await levels.locator("details").getAttribute("open"), "");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${name}/${theme}/${mode} overflows`);
      await page.screenshot({ path: path.join(out, `${name}-${theme}-${mode}.png`), fullPage: true });
      receipts.push({ name, width, height, theme, mode, passed: true });
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  await writeFile(path.join(out, "result.json"), JSON.stringify({ receipts, pageErrors: errors, networkRequests: requests }, null, 2));
  console.log(JSON.stringify({ output: out, browserCases: receipts.length, pageErrors: errors.length, networkRequests: requests.length }));
} finally { await browser.close(); }
