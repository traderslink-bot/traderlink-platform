import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AcademyShell } from "@/app/academy/academy-shell";
import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";
import {
  getNewsArticle,
  type NewsArticle,
} from "@/src/lib/news/news-article-store";

type PageProps = {
  params: Promise<{
    ticker: string;
    slug: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="news-detail-tile">
      <p className="news-detail-label">{label}</p>
      <p className="news-detail-value">{value}</p>
    </div>
  );
}

function NewsPanel({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="news-panel">
      {eyebrow ? <p className="academy-eyebrow">{eyebrow}</p> : null}
      <h2 className="news-panel-title">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({
  empty,
  items,
}: {
  empty: string;
  items: string[];
}) {
  if (items.length === 0) {
    return <p className="news-muted">{empty}</p>;
  }

  return (
    <ul className="news-bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function getCourseLessonCounts(courseId: string): {
  coreLessonCount: number;
  deepDiveLessonCount: number;
} {
  const coursePage = getAcademyCoursePage(courseId);
  const lessons = coursePage?.modules.flatMap(({ lessons }) => lessons) ?? [];

  return {
    coreLessonCount: lessons.filter(
      (lesson) => lesson.counts_toward_course_progress,
    ).length,
    deepDiveLessonCount: lessons.filter(
      (lesson) => !lesson.counts_toward_course_progress,
    ).length,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { ticker, slug } = await params;
  const article = await getNewsArticle(ticker, slug);

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
      canonical: `/news/${article.ticker}/${article.slug}`,
    },
    openGraph: {
      title: `${article.ticker}: ${article.headline}`,
      description: article.summary || undefined,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { ticker, slug } = await params;
  const article = await getNewsArticle(ticker, slug);

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
  const alertSummary =
    article.summary ||
    asText(ai.summary || rawPayload.summary, "No AI summary was stored.");
  const snapshotRows: Array<[string, string]> = [
    detailRow("Market cap", asText(metadata.marketCap)),
    detailRow("Float", asText(metadata.float)),
    detailRow("I/O", asText(metadata.io)),
    ...(secArticle ? ([["Filing type", filingType]] as Array<[string, string]>) : []),
  ].filter(([, value]) => value !== "N/A");
  const dilutionRows: Array<[string, string]> = [
    detailRow("Can dilute today", boolText(metadata.canDiluteToday ?? ai.canDiluteToday)),
    detailRow("Earliest dilution", asText(metadata.earliestDilution || ai.earliestDilution)),
    detailRow("Dilution status", asText(metadata.dilutionStatus || ai.dilutionStatus)),
    detailRow("Dilution timing", asText(metadata.dilutionTiming || ai.dilutionTiming)),
    detailRow("Trigger type", asText(metadata.dilutionTriggerType || ai.dilutionTriggerType)),
    detailRow("Trigger date", asText(metadata.dilutionTriggerDate || ai.dilutionTriggerDate)),
  ].filter(([, value]) => value !== "N/A" && value !== "Not specified");
  const launchCourseIds = new Set(getLaunchAcademyCourseIds());
  const availableCourses = getAcademyCourses().filter((course) =>
    launchCourseIds.has(course.course_id),
  );

  return (
    <AcademyShell>
      <article className="academy-container news-article-page">
        <header className="news-article-hero">
          <div className="news-chip-row">
            <span className="news-chip news-chip-primary">${article.ticker}</span>
            <span className="news-chip">{formatDate(article.publishedAt)}</span>
            <span className="news-chip">AI processed</span>
            {filingType !== "N/A" ? <span className="news-chip">{filingType}</span> : null}
          </div>

          <div className="news-hero-grid">
            <div>
              <p className="academy-eyebrow">TradersLink News</p>
              <h1 className="academy-title-sm">{article.headline}</h1>
              <p className="academy-lede">{alertSummary}</p>
            </div>

            <div className="news-action-card">
              <Link className="academy-card-action" href={`/news/${article.ticker}`}>
                {article.ticker} news
              </Link>
              {article.sourceUrl && secArticle ? (
                <a
                  className="news-secondary-action"
                  href={article.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open SEC filing
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <div className="news-layout">
          <div className="news-main-column">
            <NewsPanel eyebrow="Alert Snapshot" title="What the alert found">
              <p className="news-body-copy">{alertSummary}</p>
              {snapshotRows.length > 0 ? (
                <div className="news-detail-grid">
                  {snapshotRows.map(([label, value]) => (
                    <DetailTile key={label} label={label} value={value} />
                  ))}
                </div>
              ) : null}
            </NewsPanel>

            <div className="news-two-column">
              <NewsPanel eyebrow="Positive Context" title="Potential positives">
                <BulletList
                  empty="No positive notes were stored with this alert."
                  items={article.positives}
                />
              </NewsPanel>

              <NewsPanel eyebrow="Risk Context" title="Risks and negatives">
                <BulletList
                  empty="No negative notes were stored with this alert."
                  items={article.negatives}
                />
              </NewsPanel>
            </div>

            {supportResistanceLevels ? (
              <NewsPanel eyebrow="Chart Context" title="Support and Resistance">
                <pre className="news-levels-block">{supportResistanceLevels}</pre>
              </NewsPanel>
            ) : null}

            {dilutionRows.length > 0 ? (
              <NewsPanel eyebrow="Filing Context" title="Dilution and filing checks">
                <div className="news-detail-grid">
                  {dilutionRows.map(([label, value]) => (
                    <DetailTile key={label} label={label} value={value} />
                  ))}
                </div>
              </NewsPanel>
            ) : null}
          </div>

          <aside className="news-sidebar">
            <NewsPanel title="Academy Context">
              <p className="news-muted">
                News alerts are easier to review when the trader separates the
                headline, filing context, chart reaction, and execution plan.
              </p>
              <div className="news-course-list">
                {availableCourses.slice(0, 4).map((course) => {
                  const counts = getCourseLessonCounts(course.course_id);

                  return (
                    <Link
                      className="news-course-link"
                      href={course.course_slug}
                      key={course.course_id}
                    >
                      <span>{course.course_title}</span>
                      <small>
                        {counts.coreLessonCount} core lessons
                        {counts.deepDiveLessonCount
                          ? ` + ${counts.deepDiveLessonCount} references`
                          : ""}
                      </small>
                    </Link>
                  );
                })}
              </div>
            </NewsPanel>
          </aside>
        </div>
      </article>
    </AcademyShell>
  );
}
