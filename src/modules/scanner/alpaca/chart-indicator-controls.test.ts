import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ChartPreferencesPanel } from "@/app/(dashboard)/charts/chart-preferences-panel";
import { chartIndicatorDefinitions, type ChartIndicatorOverrides } from "@/app/(dashboard)/charts/chart-view-memory";
import { DEFAULT_CHART_PREFERENCES, changeIndicatorDisplayChoice, type ChartPreferences, type IndicatorDisplayChoices } from "./chart-preferences";

it("uses the same indicator controls for the named chart and all charts", async () => {
 vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
 const host = document.createElement("div");
 document.body.append(host);
 const root = createRoot(host);
 const initial: ChartPreferences = {
  ...DEFAULT_CHART_PREFERENCES,
  indicators: [{ id: "ema9", type: "EMA", period: 9, color: "#ff9900", width: 2 }],
 };
 const save = vi.fn<(next: ChartPreferences) => void>();
 const saved = () => save.mock.lastCall?.[0] ?? initial;
 function Panel() {
  const [preferences, setPreferences] = useState(initial);
  const [display, setDisplay] = useState<IndicatorDisplayChoices>({});
  const [overrides, setOverrides] = useState<ChartIndicatorOverrides>({});
  return createElement(ChartPreferencesPanel, {
   ticker: "VIVS", timeframe: "15m", panel: "indicators", onClose: () => undefined,
   preferences, crosshairLines: [], message: "", indicatorDisplay: display,
   chartIndicators: chartIndicatorDefinitions(preferences.indicators, preferences.indicatorDefinitionRevisions, overrides),
   onChartIndicatorsChange: (type, indicators) => setOverrides(current => ({ ...current, [type]: {
    revision: preferences.indicatorDefinitionRevisions?.[type] ?? 0,
    indicators: indicators.filter(indicator => indicator.type === type),
   }})),
   onChange: next => { save(next); setPreferences(next); },
   onIndicatorDisplayChange: (type, action, value) => setDisplay(current =>
    changeIndicatorDisplayChoice(current, type, action, value, preferences.indicatorDisplay?.[type]?.[action]?.revision ?? 0)),
  });
 }
 const input = (selector: string) => document.querySelector<HTMLInputElement>(selector)!;
 const values = () => input('[aria-label="Show EMA values"]');
 const visible = () => input('[aria-label="Show EMA indicator"]');
 const selectField = (label: string) => [...document.querySelectorAll('[role="combobox"]')].find(element =>
  element.getAttribute('aria-labelledby')?.split(' ').some(id => document.getElementById(id)?.textContent === label))!;
 const applyTo = () => selectField("Apply to");
 const selectTarget = async (label: string) => {
  await act(async () => applyTo().dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(element => element.textContent?.replace(/\s+/g, " ") === label)!;
  await act(async () => option.click());
 };
 try {
  await act(async () => root.render(createElement(Panel)));
  expect(applyTo().textContent?.replace(/\s+/g, " ")).toBe("VIVS chart");
  const catalog = [...document.querySelectorAll<HTMLLabelElement>("label")].find(label =>
   label.textContent === "Add indicator")?.control as HTMLInputElement;
  expect(catalog).toBeInstanceOf(HTMLInputElement);
  await act(async () => catalog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const optionLabels = [...document.querySelectorAll('[role="option"]')].map(option => option.textContent);
  for (const name of ["Bollinger Bands", "Hull Moving Average", "Keltner Channels", "Relative Volume", "Supertrend", "Schaff Trend Cycle"]) {
   expect(optionLabels.some(label => label?.startsWith(name))).toBe(true);
  }
  expect(document.querySelector('[role="listbox"]')?.textContent).toContain("Favorites");
  await act(async () => catalog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect([...values().closest("table")!.querySelectorAll("thead th")].slice(0, 3)
   .map(heading => heading.textContent)).toEqual(["Indicator", "Show values", "Show indicator"]);
  await act(async () => values().click());
  expect(values().checked).toBe(false);
  expect(save).not.toHaveBeenCalled();

  await selectTarget("All charts");
  expect(values().checked).toBe(true);
  await act(async () => values().click());
  await act(async () => visible().click());
  expect(saved().indicatorDisplay?.EMA).toEqual({
   hidden: { value: true, revision: 1 }, enabled: { value: false, revision: 1 },
  });
  await selectTarget("VIVS chart");
  expect(values().checked).toBe(false);
  expect(visible().checked).toBe(false);
  await act(async () => visible().click());
  expect(visible().checked).toBe(true);
  expect(saved().indicatorDisplay?.EMA?.enabled?.value).toBe(false);

  expect(document.querySelector('[aria-label="Remove EMA indicator"]')).toBeNull();
  const settings = document.querySelector<HTMLButtonElement>('[aria-label="Edit EMA settings"]')!;
  await act(async () => settings.click());
  expect(document.querySelector("h3")?.textContent).toBe("EMA settings");
  const back = [...document.querySelectorAll<HTMLButtonElement>("button")]
   .find(button => button.textContent === "Back to indicators")!;
  await act(async () => back.click());
  expect(settings.closest("[hidden]")).toBeNull();
  await act(async () => settings.click());
  const remove = document.querySelector<HTMLButtonElement>('[aria-label="Remove EMA indicator"]')!;
  await act(async () => remove.click());
  const confirm = [...document.querySelectorAll<HTMLButtonElement>('button')]
   .find(button => button.textContent === "Remove indicator" && button !== remove)!;
  await act(async () => confirm.click());
  expect(saved().indicators).toEqual(initial.indicators);
  expect(visible()).toBeNull();
  expect(applyTo().textContent?.replace(/\s+/g, " ")).toBe("VIVS chart");
  expect(document.querySelector('[aria-label="Remove EMA indicator"]')).toBeNull();

  await act(async () => catalog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const rvol = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option =>
   option.textContent?.startsWith("Relative Volume"))!;
  await act(async () => rvol.click());
  expect(saved().indicators).toEqual(initial.indicators);
  expect(document.querySelector("h3")?.textContent).toBe("RVOL settings");
  const favorite = document.querySelector<HTMLButtonElement>('[aria-label="Favorite Relative Volume"]')!;
  expect(favorite.getAttribute("aria-pressed")).toBe("false");
  await act(async () => favorite.click());
  expect(saved().favoriteIndicators).toContain("RVOL");
  expect(favorite.getAttribute("aria-pressed")).toBe("true");
  await act(async () => back.click());
  expect(document.querySelector('[aria-label="Edit RVOL settings"]')).not.toBeNull();
  await selectTarget("All charts");
  expect(document.querySelector('[aria-label="Edit RVOL settings"]')).toBeNull();
  expect(visible()).not.toBeNull();
  await act(async () => catalog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const allRvol = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option =>
   option.textContent?.startsWith("Relative Volume"))!;
  await act(async () => allRvol.click());
  expect(saved().indicators.map(indicator => indicator.type)).toEqual(["EMA", "RVOL"]);
  expect(saved().indicatorDefinitionRevisions).toEqual({ RVOL: 1 });
 } finally {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
 }
});
