import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PublicSiteFooter } from "./public-site-footer";

export function LegalPageLayout({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="tl-home min-h-screen bg-[#020817] text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-8">
          <Link
            aria-label="TradersLink homepage"
            className="flex items-center"
            href="/"
          >
            <span className="tl-home-logo-card flex h-12 w-[232px] items-center overflow-hidden rounded-md border border-sky-900/60 bg-[#011E56] px-3">
              <Image
                alt="TradersLink"
                className="h-auto w-full"
                height={74}
                priority
                src="/logo-horizontal-main.png"
                width={360}
              />
            </span>
          </Link>
        </nav>
      </header>

      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="border-b border-slate-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            TradersLink legal
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            {description}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Effective August 12, 2026
          </p>
        </div>

        <div className="mt-9 space-y-9 text-[0.98rem] leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-100 [&_li]:pl-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>

      <PublicSiteFooter />
    </main>
  );
}
