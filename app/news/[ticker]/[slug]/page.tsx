import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { PublicSiteFooter } from "@/app/public-site-footer";
import { PublicSiteHeader } from "@/app/public-site-header";
import {
  getNewsArticle,
  type NewsArticle,
} from "@/src/lib/news/news-article-store";
import {
  formatFinnhubCountry,
  formatFinnhubExchange,
  formatFinnhubMarketCap,
  formatFinnhubWebsite,
  getFinnhubCompanyProfile,
} from "@/src/lib/news/finnhub-company-profile";

type PageProps = {
  params: Promise<{
    ticker: string;
    slug: string;
  }>;
};

type NewsArticleAccessMode = "full" | "free";

type NewsSectionIcon =
  | "assessment"
  | "book"
  | "check"
  | "levels"
  | "negative"
  | "rule"
  | "trendUp";

type NewsSectionIconTone = "primary" | "success" | "warning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Metadata and the page render request the same article. React's request-scoped
// cache prevents that pair from issuing duplicate Neon reads.
const getCachedNewsArticle = cache((ticker: string, slug: string) =>
  getNewsArticle(ticker, slug),
);

const TRADERSLINK_BETA_FEATURES = [
  {
    description: "Enter the executions you took each day and TradersLink builds the trades for you. Review them by ticker with trade replay charts, then add trade notes, tags, and rules. Finish the day with what went well, what to work on, and your main focus for next time.",
    icon: "trendUp",
    title: "Session Tracker",
  },
  {
    description: "Analyze every trade—not just your totals. Review detailed entry, exit, and complete-trade analysis, then use long-term results to study your execution habits over time. See missed profit opportunities, exits that may have happened too early, and trades that were green before they finished red. Candle-pattern data helps you study the conditions around your entries and exits.",
    icon: "assessment",
    title: "Trade Analyzer",
  },
  {
    description: "Use preset trading rules that TradersLink can track from your recorded trades. Review when a rule may have been broken, see your results over time, and create custom rules for your own process.",
    icon: "rule",
    title: "Smart Rules",
  },
  {
    description: "Get press-release alerts inside your dashboard, including alerts when a stock is halted, so important news is visible while you track your trades.",
    icon: "negative",
    title: "Press Release Alerts",
  },
  {
    description: "Open a completed trade and go deeper. Review its executions, result, notes, tags, rules, and analysis in one place.",
    icon: "book",
    title: "Trade Explorer",
  },
  {
    description: "Understand your trading history from more than one angle. Explore results by ticker, time of day, holding time, setups, and other patterns supported by your recorded trades.",
    icon: "levels",
    title: "Analytics",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: NewsSectionIcon;
  title: string;
}>;

function asText(value: unknown, fallback = "N/A"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function asMultilineText(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    : "";
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function boolText(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not specified";
}

function detailRow(label: string, value: string): [string, string] {
  return [label, value];
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLevelsText(value: unknown): string {
  return asMultilineText(value)
    .replace(/\*\*/g, "")
    .replace(/_/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function isSecArticle(article: NewsArticle, eventType: string): boolean {
  const sourceHostname = asText(article.metadata.sourceHostname, "");

  return (
    Boolean(article.sourceUrl?.includes("sec.gov")) ||
    sourceHostname.includes("sec.gov") ||
    eventType.toLowerCase().startsWith("sec_")
  );
}

function DetailTile({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="news-detail-tile">
      <p className="news-detail-label">{label}</p>
      <p className="news-detail-value">
        {href ? (
          <a href={href} rel="noopener noreferrer" target="_blank">
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function SectionCard({
  children,
  className,
  icon,
  iconTone = "primary",
  kicker,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon?: NewsSectionIcon;
  iconTone?: NewsSectionIconTone;
  kicker?: string;
  title: string;
}) {
  return (
    <section className={["news-surface-card", className].filter(Boolean).join(" ")}>
      {kicker ? <p className="news-card-kicker">{kicker}</p> : null}
      <div className="news-card-heading">
        {icon ? (
          <span
            aria-hidden="true"
            className={`news-section-icon news-section-icon-${iconTone}`}
          >
            <NewsSectionIconGraphic icon={icon} />
          </span>
        ) : null}
        <h2 className="news-card-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NewsSectionIconGraphic({ icon }: { icon: NewsSectionIcon }) {
  switch (icon) {
    case "assessment":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 19h16v2H4v-2Zm1-5h3v3H5v-3Zm5-5h3v8h-3V9Zm5-4h3v12h-3V5Z" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M5 4.5A3.5 3.5 0 0 1 8.5 1H21v17H8.5A1.5 1.5 0 0 0 7 19.5 1.5 1.5 0 0 0 8.5 21H21v2H8.5A3.5 3.5 0 0 1 5 19.5v-15Zm2 11.34A3.48 3.48 0 0 1 8.5 15H19V3H8.5A1.5 1.5 0 0 0 7 4.5v11.34Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M10.2 16.6 5.8 12.2l1.4-1.4 3 3 6.6-6.6 1.4 1.4-8 8ZM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5H5Z" />
        </svg>
      );
    case "rule":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h5v2H8v-2Z" />
        </svg>
      );
    case "levels":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 6h16v2H4V6Zm3 5h10v2H7v-2Zm-3 5h16v2H4v-2Zm2-1a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm12-5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-3 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
        </svg>
      );
    case "negative":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12 3 2.7 20h18.6L12 3Zm0 4.15L17.9 18H6.1L12 7.15ZM11 10h2v4h-2v-4Zm0 5h2v2h-2v-2Z" />
        </svg>
      );
    case "trendUp":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3.4 18 2 16.6l7.4-7.4 4 4L18.6 8H15V6h7v7h-2V9.4L13.4 16l-4-4-6 6Z" />
        </svg>
      );
  }
}

function TradersLinkBetaPromotion() {
  return (
    <section aria-labelledby="traderslink-beta-title" className="news-traderslink-beta-promotion">
      <header className="news-traderslink-beta-intro">
        <p className="news-traderslink-beta-kicker">Now available</p>
        <h2 id="traderslink-beta-title">
          TradersLink <strong>Beta App</strong>
        </h2>
        <p className="news-traderslink-beta-access">
          Free beta access for all TradersLink Discord members
          <span>(free and premium members)</span>
        </p>
      </header>

      <div className="news-traderslink-beta-feature-list">
        {TRADERSLINK_BETA_FEATURES.map((feature) => (
          <article className="news-traderslink-beta-feature" key={feature.title}>
            <span aria-hidden="true" className="news-traderslink-beta-icon">
              <NewsSectionIconGraphic icon={feature.icon} />
            </span>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="news-traderslink-beta-action">
        <span className="news-traderslink-beta-action-title">
          Log in for free<br />
          with your<br />
          discord account
        </span>
        <Link
          className="news-traderslink-beta-action-button"
          href="/api/auth/discord/login?returnTo=%2Fworkspace"
        >
          LOG IN NOW!
        </Link>
      </section>
    </section>
  );
}

function BulletList({
  empty,
  items,
  tone,
}: {
  empty: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  if (items.length === 0) {
    return <p className="news-muted">{empty}</p>;
  }

  return (
    <ul className={`news-bullet-list news-bullet-list-${tone}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export async function buildNewsArticleMetadata({
  accessMode = "full",
  params,
}: PageProps & { accessMode?: NewsArticleAccessMode }): Promise<Metadata> {
  const { ticker, slug } = await params;
  const article = await getCachedNewsArticle(ticker, slug);
  const basePath = accessMode === "free" ? "/news/free" : "/news";

  if (!article) {
    return {
      title: "News Article Not Found | TradersLink",
    };
  }

  return {
    title: `${article.ticker}: ${article.headline} | TradersLink News`,
    description:
      article.summary ||
      `Trader-focused press release summary and context for ${article.ticker}.`,
    alternates: {
      canonical: `${basePath}/${article.ticker}/${article.slug}`,
    },
    openGraph: {
      title: `${article.ticker}: ${article.headline}`,
      description: article.summary || undefined,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return buildNewsArticleMetadata(props);
}

export async function NewsArticleView({
  accessMode = "full",
  params,
}: PageProps & { accessMode?: NewsArticleAccessMode }) {
  const { ticker, slug } = await params;
  const article = await getCachedNewsArticle(ticker, slug);

  if (!article) {
    notFound();
  }

  const rawPayload = getRecord(article.rawPayload);
  const ai = getRecord(rawPayload.ai);
  const metadata = article.metadata;
  const eventType = asText(article.eventType || ai.eventType);
  const filingType = asText(metadata.filingType || ai.filingType);
  const secArticle = isSecArticle(article, eventType);
  const supportResistanceLevels = formatLevelsText(
    metadata.supportResistanceLevels ||
      rawPayload.supportResistanceLevels ||
      rawPayload.levelsText,
  );
  const showLockedLevelsCard = accessMode === "free";
  const alertSummary =
    article.summary ||
    asText(ai.summary || rawPayload.summary, "No AI summary was stored.");
  const companyProfile = await getFinnhubCompanyProfile(article.ticker);
  const companyWebsite = formatFinnhubWebsite(companyProfile?.weburl ?? null);
  const companyInfoRows = [
    { label: "Company", value: companyProfile?.name ?? null },
    { label: "Exchange", value: formatFinnhubExchange(companyProfile?.exchange ?? null) },
    { label: "Industry", value: companyProfile?.industry ?? null },
    { label: "Country", value: formatFinnhubCountry(companyProfile?.country ?? null) },
    { label: "Website", value: companyWebsite, href: companyWebsite ?? undefined },
    {
      label: "Market cap",
      value: formatFinnhubMarketCap(companyProfile?.marketCapitalization ?? null),
    },
    {
      label: "Shares outstanding",
      value: formatFinnhubMarketCap(companyProfile?.shareOutstanding ?? null),
    },
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row.value));
  const dilutionRows: Array<[string, string]> = [
    detailRow("Can dilute today", boolText(metadata.canDiluteToday ?? ai.canDiluteToday)),
    detailRow("Earliest dilution", asText(metadata.earliestDilution || ai.earliestDilution)),
    detailRow("Dilution status", asText(metadata.dilutionStatus || ai.dilutionStatus)),
    detailRow("Dilution timing", asText(metadata.dilutionTiming || ai.dilutionTiming)),
    detailRow("Trigger type", asText(metadata.dilutionTriggerType || ai.dilutionTriggerType)),
    detailRow("Trigger date", asText(metadata.dilutionTriggerDate || ai.dilutionTriggerDate)),
  ].filter(([, value]) => value !== "N/A" && value !== "Not specified");
  return (
    <>
      <PublicSiteHeader />
      <div className="academy-shell">
        <article className="academy-container news-article-page">
          <div className="news-article-stack">
          <header className="news-surface-card news-article-header-card">
            <div className="news-article-header-copy">
              <div className="news-chip-row">
                <span className="news-chip news-chip-primary">${article.ticker}</span>
                <span className="news-chip">{formatDate(article.publishedAt)}</span>
                <span className="news-chip">AI processed</span>
                {filingType !== "N/A" ? (
                  <span className="news-chip">{filingType}</span>
                ) : null}
              </div>
              <h1 className="news-article-title">{article.headline}</h1>
            </div>
          </header>

          <div className="news-dashboard-grid">
            <main className="news-main-stack">
              <SectionCard icon="assessment" title="AI Summary">
                <p className="news-body-copy">{alertSummary}</p>
              </SectionCard>

              <div className="news-two-column">
                <SectionCard
                  className="news-original-post-font-card"
                  icon="trendUp"
                  iconTone="success"
                  title="Positives"
                >
                  <BulletList
                    empty="No positive notes were stored with this alert."
                    items={article.positives}
                    tone="positive"
                  />
                </SectionCard>

                <SectionCard
                  className="news-original-post-font-card"
                  icon="negative"
                  iconTone="warning"
                  title="Negatives"
                >
                  <BulletList
                    empty="No negative notes were stored with this alert."
                    items={article.negatives}
                    tone="negative"
                  />
                </SectionCard>
              </div>

              {dilutionRows.length > 0 ? (
                <SectionCard
                  icon="rule"
                  kicker="Filing Context"
                  title="Filing and Dilution Context"
                >
                  <div className="news-detail-grid">
                    {dilutionRows.map(([label, value]) => (
                      <DetailTile key={label} label={label} value={value} />
                    ))}
                  </div>
                </SectionCard>
              ) : null}
            </main>

            <aside className="news-sidebar-stack">
              <SectionCard icon="check" title="Company Info">
                {companyInfoRows.length > 0 ? (
                  <dl className="news-company-info-list">
                    {companyInfoRows.map(({ href, label, value }) => (
                      <div className="news-company-info-row" key={label}>
                        <dt>{label}:</dt>
                        <dd>
                          {href ? (
                            <a href={href} rel="noopener noreferrer" target="_blank">
                              {value}
                            </a>
                          ) : (
                            value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="news-muted">
                    Company information is temporarily unavailable.
                  </p>
                )}
                {article.sourceUrl && secArticle ? (
                  <a
                    className="news-secondary-action news-sec-source-link"
                    href={article.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open SEC filing
                  </a>
                ) : null}
              </SectionCard>

              {showLockedLevelsCard ? (
                <SectionCard icon="levels" title="Support and Resistance">
                  <div className="news-levels-locked-card">
                    <p className="news-levels-locked-title">
                      Support and resistance levels are available to paid users.
                    </p>
                    <p className="news-muted">
                      Upgrade to view the instant levels attached to this alert.
                    </p>
                  </div>
                </SectionCard>
              ) : supportResistanceLevels ? (
                <SectionCard icon="levels" title="Support and Resistance">
                  <pre className="news-levels-block">{supportResistanceLevels}</pre>
                </SectionCard>
              ) : null}

              {accessMode === "free" ? (
                <SectionCard
                  icon="trendUp"
                  kicker="Paid Discord Feed"
                  title="Unlock The Filtered Version"
                >
                  <div className="news-levels-locked-card">
                    <p className="news-levels-locked-title">
                      Get the paid version for filtered channels and instant levels.
                    </p>
                    <p className="news-muted">
                      The free feed is one news dump channel. Paid access separates alerts
                      into focused channels and unlocks the support and resistance levels
                      attached to each post.
                    </p>
                    <Link
                      className="news-secondary-action"
                      href="https://whop.com/traderslink-app/filtered-news-momentum-scanner-access/"
                    >
                      View paid access
                    </Link>
                  </div>
                </SectionCard>
              ) : null}

              <TradersLinkBetaPromotion />
            </aside>
          </div>
          </div>
        </article>
      </div>
      <PublicSiteFooter />
    </>
  );
}

export default async function NewsArticlePage(props: PageProps) {
  return <NewsArticleView {...props} accessMode="full" />;
}
