import Decimal from "decimal.js";
import type {NormalizedJournalAnalyticsRow} from "../../../journal-analytics/server/normalize-journal-analytics-facts";
import type {JournalTradeStoryPerformance} from "./journal-trade-story-read-service";
import {platformFailure} from "../../../platform/server/database/platform-migration-contract";
const StoryDecimal=Decimal.clone({precision:160,rounding:Decimal.ROUND_HALF_UP,toExpNeg:-1000,toExpPos:1000});
function averagePrice(notionalDecimal:string,quantityDecimal:string){const quantity=new StoryDecimal(quantityDecimal);return quantity.isZero()?null:new StoryDecimal(notionalDecimal).dividedBy(quantity).toDecimalPlaces(4).toFixed();}
export function journalTradeStoryPerformanceFromRow(row:NormalizedJournalAnalyticsRow):JournalTradeStoryPerformance{
 return Object.freeze({
      chargeCostDecimal: row.chargeCostDecimal,
      chargeCoverage: row.chargeCoverage,
      chargeCreditDecimal: row.chargeCreditDecimal,
      closedAtUtc: row.closedAtUtc,
      enteredQuantityDecimal: row.enteredQuantityDecimal,
      entryNotionalDecimal: row.entryNotionalDecimal,
      entryPriceDecimal: averagePrice(row.entryNotionalDecimal, row.enteredQuantityDecimal),
      executionCount: row.uniqueExecutionCount,
      exitNotionalDecimal: row.exitNotionalDecimal,
      exitPriceDecimal: averagePrice(row.exitNotionalDecimal, row.exitQuantityDecimal),
      exitQuantityDecimal: row.exitQuantityDecimal,
      grossPnlDecimal: row.grossPnlDecimal,
      holdDurationMilliseconds: row.holdingDurationMilliseconds,
      maximumPositionQuantityDecimal: row.maximumPositionQuantityDecimal,
      netPnlDecimal: row.netPnlDecimal,
      openedAtUtc: row.openedAtUtc,
      tradeCurrency: row.tradeCurrency,
 });
}
/** Member order matches the current Journal logical trade. No report or ledger loading. */
export function aggregateJournalTradeStoryPerformance(values:readonly JournalTradeStoryPerformance[]):JournalTradeStoryPerformance|null{
 if(!values.length)return null;
 const sum = (field: keyof JournalTradeStoryPerformance) => values.reduce(
            (total, value) => {
              const next = value[field];
              if (next === null || next === undefined || typeof next === "boolean") {
                platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
              }
              return new StoryDecimal(total).plus(String(next)).toFixed();
            }, "0");
          const chargesComplete = values.every((value) => value.chargeCoverage === "complete");
          const enteredQuantityDecimal = sum("enteredQuantityDecimal");
          const entryNotionalDecimal = sum("entryNotionalDecimal");
          const exitNotionalDecimal = sum("exitNotionalDecimal");
          const exitQuantityDecimal = sum("exitQuantityDecimal");
          return Object.freeze({ ...values[0]!,
            chargeCostDecimal: chargesComplete ? sum("chargeCostDecimal") : null,
            chargeCoverage: chargesComplete ? "complete" as const : "unavailable" as const,
            chargeCreditDecimal: chargesComplete ? sum("chargeCreditDecimal") : null,
            closedAtUtc: values.at(-1)!.closedAtUtc,
            enteredQuantityDecimal,
            entryNotionalDecimal,
            entryPriceDecimal: averagePrice(entryNotionalDecimal, enteredQuantityDecimal),
            executionCount: values.reduce((total, value) => total + value.executionCount, 0),
            exitNotionalDecimal,
            exitPriceDecimal: averagePrice(exitNotionalDecimal, exitQuantityDecimal),
            exitQuantityDecimal,
            grossPnlDecimal: sum("grossPnlDecimal"),
            holdDurationMilliseconds: Date.parse(values.at(-1)!.closedAtUtc) - Date.parse(values[0]!.openedAtUtc),
            maximumPositionQuantityDecimal: StoryDecimal.max(...values.map((value) => value.maximumPositionQuantityDecimal)).toFixed(),
            netPnlDecimal: chargesComplete ? sum("netPnlDecimal") : null,
          });
}
