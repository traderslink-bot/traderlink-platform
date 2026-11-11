import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attributions | TradersLink",
  description: "Credits and licensing for the technology used in TradersLink.",
  alternates: { canonical: "/attributions" },
};

export default function AttributionsPage() {
  return (
    <main className="tl-home min-h-[55vh] bg-[#020817] text-slate-100">
      <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Attributions
        </h1>

        <section aria-labelledby="tradingview-credit" className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <h2 id="tradingview-credit" className="text-2xl font-semibold text-white">
            TradingView
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            TradersLink builds its charting tools on TradingView’s charting technology.
          </p>

          <div className="mt-6 border-t border-slate-700 pt-5">
            <p className="font-semibold text-slate-100">TradingView Lightweight Charts™</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Copyright (с) 2025 TradingView, Inc.{" "}
              <a className="font-medium text-cyan-300 underline underline-offset-4" href="https://www.tradingview.com/">
                https://www.tradingview.com/
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
