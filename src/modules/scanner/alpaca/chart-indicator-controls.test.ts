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
 try {
  await act(async () => root.render(createElement(Panel)));
  expect(document.querySelector('[role="radiogroup"]')?.textContent).toBe("VIVS chartAll charts");
  expect(input('input[type="radio"][value="current"]').checked).toBe(true);
  const valuesLabel = values().closest("label");
  expect(valuesLabel?.textContent).toBe("Show values");
  expect(valuesLabel?.classList.contains("MuiFormControlLabel-labelPlacementStart")).toBe(true);
  await act(async () => values().click());
  expect(values().checked).toBe(false);
  expect(save).not.toHaveBeenCalled();

  await act(async () => input('input[type="radio"][value="all"]').click());
  expect(values().checked).toBe(true);
  await act(async () => values().click());
  await act(async () => visible().click());
  expect(saved().indicatorDisplay?.EMA).toEqual({
   hidden: { value: true, revision: 1 }, enabled: { value: false, revision: 1 },
  });
  await act(async () => input('input[type="radio"][value="current"]').click());
  expect(values().checked).toBe(false);
  expect(visible().checked).toBe(false);
  await act(async () => visible().click());
  expect(visible().checked).toBe(true);
  expect(saved().indicatorDisplay?.EMA?.enabled?.value).toBe(false);

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
