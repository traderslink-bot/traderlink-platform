import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ChartPreferencesPanel } from "@/app/(dashboard)/charts/chart-preferences-panel";
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
  return createElement(ChartPreferencesPanel, {
   ticker: "VIVS", timeframe: "15m", panel: "indicators", onClose: () => undefined,
   preferences, crosshairLines: [], message: "", indicatorDisplay: display,
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
  await act(async () => selectField("Add indicator").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  expect([...document.querySelectorAll('[role="option"]')].map(option => option.textContent))
   .toEqual(["SMA", "VWAP", "RSI", "MACD", "Bollinger Bands"]);
  const options = document.querySelector('[role="listbox"]')!;
  await act(async () => options.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
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
  expect(saved().indicators).toEqual([]);
  expect(document.querySelector('[aria-label="Remove EMA indicator"]')).toBeNull();
 } finally {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
 }
});
