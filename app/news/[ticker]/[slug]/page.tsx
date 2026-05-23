import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";
import { AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
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

const chartReadingCourseId = "chart-reading-market-structure";
const candlestickModuleIds = new Set([
  "bullish-candle-patterns",
  "bearish-candle-patterns",
  "indecision-neutral-candles",
  "momentum-continuation-candles",
  "session-gap-behavior",
]);
const chartPatternModuleIds = new Set(["chart-patterns-context"]);

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

function SectionCard({
  children,
  className,
  kicker,
  title,
}: {
  children: ReactNode;
  className?: string;
  kicker?: string;
  title: string;
}) {
  return (
    <section className={["news-surface-card", className].filter(Boolean).join(" ")}>
      {kicker ? <p className="news-card-kicker">{kicker}</p> : null}
      <h2 className="news-card-title">{title}</h2>
      {children}
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
  const academyCourses = getAcademyCourses();
  const availableCourses = getLaunchAcademyCourseIds()
    .map((courseId) => {
      const course = academyCourses.find((item) => item.course_id === courseId);
      const coursePage = getAcademyCoursePage(courseId);

      return course && coursePage ? { course, coursePage } : null;
    })
    .filter((item) => item !== null);
  const academySession = await getCurrentAcademySession();
  const completedLessonSlugs = academySession
    ? new Set(
        await new AcademyProgressStore().listCompletedLessonSlugs(
          academySession.discordUserId,
        ),
      )
    : new Set<string>();

  return (
    <AcademyShell>
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
              <SectionCard title="AI Summary">
                <p className="news-body-copy">{alertSummary}</p>
              </SectionCard>

              <div className="news-two-column">
                <SectionCard className="news-original-post-font-card" title="Positives">
                  <BulletList
                    empty="No positive notes were stored with this alert."
                    items={article.positives}
                    tone="positive"
                  />
                </SectionCard>

                <SectionCard className="news-original-post-font-card" title="Negatives">
                  <BulletList
                    empty="No negative notes were stored with this alert."
                    items={article.negatives}
                    tone="negative"
                  />
                </SectionCard>
              </div>

              {dilutionRows.length > 0 ? (
                <SectionCard
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
              <SectionCard title="Snapshot">
                {snapshotRows.length > 0 ? (
                  <div className="news-detail-grid news-detail-grid-compact">
                    {snapshotRows.map(([label, value]) => (
                      <DetailTile key={label} label={label} value={value} />
                    ))}
                  </div>
                ) : (
                  <p className="news-muted">
                    No market snapshot fields were stored with this alert.
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

              {supportResistanceLevels ? (
                <SectionCard title="Support and Resistance">
                  <pre className="news-levels-block">{supportResistanceLevels}</pre>
                </SectionCard>
              ) : null}

              {availableCourses.length > 0 ? (
                <SectionCard kicker="Available Now" title="Begin The Academy Path">
                  <div className="academy-module-list news-academy-course-list">
                    {availableCourses.map(({ course, coursePage }) => {
                      const lessons = coursePage.modules.flatMap(
                        ({ lessons }) => lessons,
                      );
                      const progress = getCourseProgress(
                        lessons,
                        completedLessonSlugs,
                      );
                      const lessonGroupProgress = getCourseLessonGroupProgress(
                        course.course_id,
                        lessons,
                        completedLessonSlugs,
                      );

                      return (
                        <Link
                          className="academy-card academy-card-link"
                          href={course.course_slug}
                          key={course.course_id}
                        >
                          <div className="academy-card-topline">
                            <p className="academy-kicker">
                              Course {course.course_order}
                            </p>
                            <span className="academy-chip academy-chip-success">
                              Open now
                            </span>
                          </div>
                          <h3 className="academy-card-title">
                            {course.course_title}
                          </h3>
                          <p className="academy-card-text">
                            {course.course_outcome || course.display_model}
                          </p>
                          <div className="academy-chip-row">
                            <span className="academy-chip">
                              {coursePage.totalLessonCount} lessons
                            </span>
                          </div>
                          <div className="academy-course-progress">
                            <CourseProgressMeter
                              isAuthenticated={Boolean(academySession)}
                              label={
                                course.course_id === chartReadingCourseId
                                  ? "Core lessons"
                                  : undefined
                              }
                              progress={progress}
                            />
                            {lessonGroupProgress.map((groupProgress) => (
                              <CourseProgressMeter
                                isAuthenticated={Boolean(academySession)}
                                key={groupProgress.label}
                                label={groupProgress.label}
                                progress={groupProgress}
                              />
                            ))}
                          </div>
                          <span className="academy-card-action">Open course</span>
                        </Link>
                      );
                    })}
                  </div>
                </SectionCard>
              ) : null}
            </aside>
          </div>
        </div>
      </article>
    </AcademyShell>
  );
}

function getCourseProgress(
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const progressLessons = lessons.filter(
    (lesson) => lesson.counts_toward_course_progress,
  );
  const completed = progressLessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = progressLessons.length;

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function getCourseLessonGroupProgress(
  courseId: string,
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  if (courseId !== chartReadingCourseId) {
    return [];
  }

  return [
    getLessonGroupProgress(
      "Candlestick lessons",
      lessons.filter((lesson) => candlestickModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
    getLessonGroupProgress(
      "Chart pattern lessons",
      lessons.filter((lesson) => chartPatternModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
  ].filter((progress) => progress.total > 0);
}

function getLessonGroupProgress(
  label: string,
  lessons: Array<{
    lesson_slug: string;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const completed = lessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = lessons.length;

  return {
    completed,
    label,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function CourseProgressMeter({
  isAuthenticated,
  label,
  progress,
}: {
  isAuthenticated: boolean;
  label?: string;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
}) {
  return (
    <div className="academy-course-progress-row">
      {label ? (
        <p className="academy-course-progress-label">{label}</p>
      ) : null}
      <div className="academy-course-progress-track">
        <span
          className="academy-course-progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="academy-course-progress-meta">
        <span>
          {isAuthenticated
            ? `${progress.percent}% complete`
            : "Log in to track progress"}
        </span>
        <span>
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  );
}
