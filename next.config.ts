import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["levels-system-phase1"],
  async redirects() {
    return [
      {
        source: "/academy/candlestick-patterns/hammer/",
        destination: "/academy/candle-behavior/hammer/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/bottoming-tail/",
        destination: "/academy/candle-behavior/bottoming-tail-candle/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/topping-tail/",
        destination: "/academy/candle-behavior/topping-tail-candle/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/doji/",
        destination: "/academy/candle-behavior/standard-doji/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/spinning-top/",
        destination: "/academy/candle-behavior/spinning-top/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/inside-bar/",
        destination: "/academy/candle-behavior/inside-bar/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/outside-bar/",
        destination: "/academy/candle-behavior/outside-bar/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/candle-volume-confirmation/",
        destination: "/academy/candle-behavior/high-volume-green-candle/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/red-to-green-move/",
        destination: "/academy/candle-behavior/red-to-green-move/",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/green-to-red-move/",
        destination: "/academy/candle-behavior/green-to-red-move/",
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
