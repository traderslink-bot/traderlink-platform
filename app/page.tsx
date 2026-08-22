import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FreeDiscordPrompt } from "./free-discord-prompt";
import { HomeScrollReveal } from "./home-scroll-reveal";
import { LandingHeroCanvas } from "./landing-hero-canvas";
import { PublicSiteFooter } from "./public-site-footer";

const dashboardHostname = "app.traderslink.pro";
const discordInviteUrl = "https://discord.gg/9dmGpfpRDD";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TradersLink | Trading Tools, Academy, and Trade Tracker",
  description:
    "TradersLink brings together small-cap trading tools, free Academy lessons, premium Watchlist access, and Trade Tracker.",
  alternates: { canonical: "/" },
};

function requestHostname(requestHeaders: Headers): string | undefined {
  return (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
    ?.split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.toLowerCase();
}

export default async function Home() {
  if (requestHostname(await headers()) === dashboardHostname) {
    redirect("/api/auth/discord/login?returnTo=%2Fworkspace");
  }

  return (
    <main className="tl-home min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <HomeScrollReveal />
      <FreeDiscordPrompt discordInviteUrl={discordInviteUrl} />
      <section className="tl-home-hero relative min-h-[82vh] overflow-hidden border-b border-cyan-400/20">
        <LandingHeroCanvas />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(2,8,23,0.96)_0%,rgba(2,8,23,0.8)_36%,rgba(2,8,23,0.28)_70%,rgba(2,8,23,0.08)_100%)]" />
        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center" aria-label="TradersLink homepage">
            <span className="tl-home-logo-card flex h-12 w-[232px] items-center overflow-hidden rounded-md border border-sky-900/60 bg-[#011E56] px-3">
              <Image alt="TradersLink" className="h-auto w-full" height={74} priority src="/logo-horizontal-main.png" width={360} />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-semibold text-cyan-100 hover:text-cyan-300 sm:inline" href="/academy">Academy</Link>
            <Link className="hidden text-sm font-semibold text-cyan-100 hover:text-cyan-300 sm:inline" href="/help">Help Center</Link>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-cyan-300 bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" href="https://app.traderslink.pro/workspace">Open Trade Tracker</Link>
          </div>
        </nav>
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-12 sm:px-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:pb-16 lg:pt-20">
          <div className="tl-home-hero-copy flex max-w-4xl flex-col" data-home-animate>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">TradersLink Platform</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">Trading tools that help you prepare, learn, and review.</h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300 sm:text-2xl">Build your foundation with free Academy lessons, use the premium Watchlist with your Discord membership, and review your trades in Trade Tracker.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="tl-home-cta inline-flex min-h-12 items-center justify-center border border-cyan-300 bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" href="/academy">Start free Academy lessons</Link>
              <a className="tl-home-cta tl-home-cta-secondary inline-flex min-h-12 items-center justify-center border border-cyan-300/50 bg-slate-950/50 px-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200" href={discordInviteUrl} rel="noopener noreferrer" target="_blank">Join Free Discord</a>
            </div>
          </div>
          <aside className="tl-home-panel self-end border border-cyan-300/20 bg-slate-950/58 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur" data-home-animate>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Available now</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-200">
              <HomeLink href="/academy" title="TradersLink Academy">Free lessons on charts, risk, market structure, and trading habits.</HomeLink>
              <HomeLink href="/watchlist" title="Premium Watchlist">Discord-gated watchlist access for Premium members.</HomeLink>
              <HomeLink href="https://app.traderslink.pro/workspace" title="Trade Tracker">Your private dashboard for saved trades and review.</HomeLink>
              <HomeLink href="/help" title="Help Center">Open guides for the Platform, Academy, and Trade Tracker.</HomeLink>
            </div>
          </aside>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-16 sm:px-8 md:grid-cols-3" data-home-animate data-scroll-reveal>
        <HomeCard href="/academy" number="01" title="Learn">Free Academy courses give traders a structured path through chart reading, market structure, risk, and trade review.</HomeCard>
        <HomeCard href="/watchlist" number="02" title="Plan">Premium Watchlist access keeps live ideas and their context in one place for eligible Discord members.</HomeCard>
        <HomeCard href="https://app.traderslink.pro/workspace" number="03" title="Review">Trade Tracker is your private workspace for saved trades, manual entries, and post-session review.</HomeCard>
      </section>
      <section className="tl-home-section-surface border-y border-slate-800 bg-slate-950 px-5 py-16 sm:px-8" data-home-animate data-scroll-reveal>
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-2">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Premium access</p><h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Scanner alerts, market context, and trader tools in one Platform.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Premium membership keeps Discord market tools together with Watchlist access. Academy lessons remain free for everyone, with optional Discord login to save progress.</p></div>
          <div className="tl-home-panel border border-cyan-300/20 bg-[#041328] p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Need a hand?</p><h2 className="mt-3 text-2xl font-semibold text-white">Every Help guide is open to search.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Browse guides for Academy, Watchlist, imports, analytics, and Trade Tracker without signing in.</p><Link className="tl-home-cta tl-home-cta-secondary mt-5 inline-flex min-h-11 items-center justify-center border border-cyan-300/50 bg-slate-950/50 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200" href="/help">Browse Help Center</Link></div>
        </div>
      </section>
      <PublicSiteFooter />
    </main>
  );
}

function HomeLink({ children, href, title }: { children: string; href: string; title: string }) {
  return <Link className="tl-home-list-row block border-t border-slate-800 pt-3 text-slate-100" href={href}><span className="block font-semibold">{title}</span><span className="mt-1 block leading-5 text-slate-400">{children}</span></Link>;
}

function HomeCard({ children, href, number, title }: { children: string; href: string; number: string; title: string }) {
  return <article className="tl-home-card border border-slate-800 bg-slate-950 p-5" data-scroll-reveal><p className="text-3xl font-semibold text-cyan-300">{number}</p><h2 className="mt-4 text-xl font-semibold text-white">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{children}</p><Link className="mt-5 inline-flex font-semibold text-cyan-200 hover:text-cyan-100" href={href}>Open {title}</Link></article>;
}
