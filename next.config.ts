import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["levels-system-phase1"],
  async redirects() {
    return [
      {
        source: "/academy/candlestick-patterns/hammer/",
        destination: "/academy/candle-behavior/bullish-candle-patterns/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/bottoming-tail/",
        destination: "/academy/candle-behavior/bullish-candle-patterns/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/topping-tail/",
        destination: "/academy/candle-behavior/bearish-candle-patterns/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/doji/",
        destination: "/academy/candle-behavior/indecision-and-neutral-candles/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/spinning-top/",
        destination: "/academy/candle-behavior/indecision-and-neutral-candles/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/inside-bar/",
        destination: "/academy/candle-behavior/indecision-and-neutral-candles/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/outside-bar/",
        destination: "/academy/candle-behavior/momentum-and-continuation-candles/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/candle-volume-confirmation/",
        destination: "/academy/candle-behavior/momentum-and-continuation-candles/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/red-to-green-move/",
        destination: "/academy/candle-behavior/session-and-gap-behavior/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/green-to-red-move/",
        destination: "/academy/candle-behavior/session-and-gap-behavior/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/long-wick-candle/",
        destination: "/academy/candlestick-deep-dive-lessons/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/pin-bar/",
        destination: "/academy/candlestick-deep-dive-lessons/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/engulfing-candle/",
        destination: "/academy/candlestick-deep-dive-lessons/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
