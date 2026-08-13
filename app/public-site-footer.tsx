"use client";

import Link from "next/link";

import { OPEN_COOKIE_CHOICES_EVENT } from "@/src/lib/privacy/analytics-consent-events";

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#020817] px-5 py-8 text-sm text-slate-400 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span>TradersLink. Trading involves risk.</span>
        <nav
          aria-label="Legal and privacy links"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          <Link className="hover:text-white" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="hover:text-white" href="/terms">
            Terms and Conditions
          </Link>
          <button
            className="text-left hover:text-white"
            onClick={() =>
              window.dispatchEvent(new Event(OPEN_COOKIE_CHOICES_EVENT))
            }
            type="button"
          >
            Cookie choices
          </button>
        </nav>
      </div>
    </footer>
  );
}
