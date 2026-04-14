// 2026-04-12 10:18 AM America/Toronto
// PURPOSE:
// Provides sample Yahoo-style candle data for raw trade timeline fixture testing.
// This file stays outside the raw trade timeline core and is intended for controlled test input.

import type { YahooChartResponse } from "../../market-data-sources/yahoo/yahoo-candle-types";

export const sampleYahooChartResponse: YahooChartResponse = {
  chart: {
    result: [
      {
        meta: {
          symbol: "ABCD",
          dataGranularity: "1m",
          range: "1d",
          exchangeTimezoneName: "America/New_York",
        },
        timestamp: [
          1712928600, // 2024-04-12T13:30:00.000Z
          1712928660, // 2024-04-12T13:31:00.000Z
          1712928720, // 2024-04-12T13:32:00.000Z
          1712928780, // 2024-04-12T13:33:00.000Z
          1712928840, // 2024-04-12T13:34:00.000Z
          1712928900, // 2024-04-12T13:35:00.000Z
          1712928960, // 2024-04-12T13:36:00.000Z
          1712929020, // 2024-04-12T13:37:00.000Z
          1712929080, // 2024-04-12T13:38:00.000Z
          1712929140, // 2024-04-12T13:39:00.000Z
          1712929200, // 2024-04-12T13:40:00.000Z
        ],
        indicators: {
          quote: [
            {
              open:  [1.00, 1.03, 1.07, 1.12, 1.18, 1.22, 1.28, 1.24, 1.31, 1.34, 1.29],
              high:  [1.04, 1.08, 1.13, 1.19, 1.24, 1.30, 1.33, 1.32, 1.36, 1.35, 1.31],
              low:   [0.99, 1.02, 1.06, 1.11, 1.17, 1.21, 1.23, 1.22, 1.30, 1.27, 1.26],
              close: [1.03, 1.07, 1.12, 1.18, 1.22, 1.28, 1.24, 1.31, 1.34, 1.29, 1.27],
              volume:[12000, 18000, 24000, 22000, 27000, 30000, 28000, 26000, 25000, 21000, 17000],
            },
          ],
        },
      },
    ],
    error: null,
  },
};