"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  GoogleAnalytics,
} from "./google-analytics";
import { OPEN_COOKIE_CHOICES_EVENT } from "@/src/lib/privacy/analytics-consent-events";

const CONSENT_STORAGE_KEY = "traderslink_analytics_consent_v1";
const CONSENT_DURATION_MS = 180 * 24 * 60 * 60 * 1_000;

type AnalyticsChoice = "granted" | "denied";
type RegionStatus = "checking" | "prior-consent" | "normal";

type StoredAnalyticsChoice = Readonly<{
  choice: AnalyticsChoice;
  expiresAt: number;
}>;

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<AnalyticsChoice | null>(null);
  const [regionStatus, setRegionStatus] = useState<RegionStatus>("checking");
  const [choicesOpen, setChoicesOpen] = useState(false);

  useEffect(() => {
    const storedChoice = readStoredChoice();
    if (storedChoice) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setChoice(storedChoice);
        setAnalyticsDisabled(storedChoice === "denied");
      });
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();

    void fetch("/api/privacy/analytics-consent-region", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Consent region is unavailable.");
        const body = (await response.json()) as {
          requiresPriorConsent?: unknown;
        };
        setRegionStatus(
          body.requiresPriorConsent === false ? "normal" : "prior-consent",
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRegionStatus("prior-consent");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    function openChoices() {
      setChoicesOpen(true);
    }

    window.addEventListener(OPEN_COOKIE_CHOICES_EVENT, openChoices);
    return () =>
      window.removeEventListener(OPEN_COOKIE_CHOICES_EVENT, openChoices);
  }, []);

  const analyticsEnabled =
    choice === "granted" || (choice === null && regionStatus === "normal");
  const needsInitialChoice =
    choice === null && regionStatus === "prior-consent";
  const showChoices = needsInitialChoice || choicesOpen;

  function selectChoice(nextChoice: AnalyticsChoice) {
    storeChoice(nextChoice);
    setChoice(nextChoice);
    setChoicesOpen(false);
    setAnalyticsDisabled(nextChoice === "denied");
    if (nextChoice === "denied") deleteAnalyticsCookies();
  }

  return (
    <>
      <GoogleAnalytics enabled={analyticsEnabled} />
      {showChoices ? (
        <section
          aria-label="Analytics cookie choices"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-[2000] mx-auto max-w-3xl rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl sm:inset-x-5 sm:p-5"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Analytics choices
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                We use necessary storage to run TradersLink. Google Analytics
                helps us understand visits and improve the site. You can allow
                or reject optional Analytics without affecting access.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Current choice: {choiceLabel(choice, regionStatus)}. Read our{" "}
                <Link
                  className="font-semibold text-[#073b78] underline underline-offset-2"
                  href="/privacy"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            {!needsInitialChoice ? (
              <button
                aria-label="Close analytics choices"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-300 text-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setChoicesOpen(false)}
                type="button"
              >
                X
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className="min-h-10 rounded-lg border border-[#011E56] bg-white px-4 text-sm font-bold text-[#011E56] hover:bg-slate-50"
              onClick={() => selectChoice("denied")}
              type="button"
            >
              Reject optional
            </button>
            <button
              className="min-h-10 rounded-lg border border-[#011E56] bg-[#011E56] px-4 text-sm font-bold text-white hover:bg-[#073b78]"
              onClick={() => selectChoice("granted")}
              type="button"
            >
              Accept analytics
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

function choiceLabel(
  choice: AnalyticsChoice | null,
  regionStatus: RegionStatus,
): string {
  if (choice === "granted") return "Analytics allowed";
  if (choice === "denied") return "optional Analytics off";
  if (regionStatus === "normal") return "Analytics on for this region";
  return "no optional Analytics until you choose";
}

function readStoredChoice(): AnalyticsChoice | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredAnalyticsChoice>;
    if (
      (stored.choice !== "granted" && stored.choice !== "denied") ||
      typeof stored.expiresAt !== "number" ||
      stored.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    return stored.choice;
  } catch {
    return null;
  }
}

function storeChoice(choice: AnalyticsChoice): void {
  const stored: StoredAnalyticsChoice = {
    choice,
    expiresAt: Date.now() + CONSENT_DURATION_MS,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // The current-page choice still applies when browser storage is unavailable.
  }
}

function setAnalyticsDisabled(disabled: boolean): void {
  if (!GOOGLE_ANALYTICS_MEASUREMENT_ID) return;
  Reflect.set(
    window,
    `ga-disable-${GOOGLE_ANALYTICS_MEASUREMENT_ID}`,
    disabled,
  );
}

function deleteAnalyticsCookies(): void {
  const cookieNames = document.cookie
    .split(";")
    .map((entry) => entry.split("=", 1)[0]?.trim())
    .filter((name): name is string => Boolean(name?.startsWith("_ga")));
  const hostname = window.location.hostname;
  const domains = new Set<string | null>([null, hostname]);

  if (hostname === "traderslink.pro" || hostname.endsWith(".traderslink.pro")) {
    domains.add("traderslink.pro");
    domains.add(".traderslink.pro");
  }

  for (const name of cookieNames) {
    for (const domain of domains) {
      document.cookie = [
        `${name}=`,
        "Path=/",
        "Max-Age=0",
        "SameSite=Lax",
        ...(domain ? [`Domain=${domain}`] : []),
      ].join("; ");
    }
  }
}
