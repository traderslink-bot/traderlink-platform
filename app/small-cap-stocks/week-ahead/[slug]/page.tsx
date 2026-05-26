import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import { SiteShell } from "@/src/components/site/site-shell";
import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";
import { AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
import {
  getBigTimePennyArticle,
  getPublicCatalystArticleDate,
  getPublicCatalystArticleTitle,
  listBigTimePennyArticles,
  type BigTimePennyArticle,
} from "@/src/lib/news/big-time-pennies-store";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const runtime = "nodejs";

const chartReadingCourseId = "chart-reading-market-structure";
const candlestickModuleIds = new Set([
  "bullish-candle-patterns",
  "bearish-candle-patterns",
  "indecision-neutral-candles",
  "momentum-continuation-candles",
  "session-gap-behavior",
]);
const chartPatternModuleIds = new Set(["chart-patterns-context"]);

type EventGroup = {
  dateLabel: string;
  title: string;
  summary: string;
  tickers: string[];
};

type CatalystGroup = {
  dateLabel: string;
  items: Array<{
    ticker: string;
    text: string;
  }>;
};

type StructuredWeekAheadContent = {
  companyCatalysts: CatalystGroup[];
  conferenceEvents: EventGroup[];
  dateRange: string;
  riskNotes: string[];
  title: string;
  version: number;
};

const conferenceEventGroups: EventGroup[] = [
  {
    dateLabel: "May 27–30",
    title: "Companies Presenting at EASL Congress 2026",
    summary:
      "EASL Congress 2026 is scheduled for May 27–30 in Barcelona with hybrid participation. The hepatology-focused conference can bring attention to liver disease research, clinical programs, and emerging therapy updates.",
    tickers: ["PRQR", "AVIR", "MTVA", "GALT", "CMMB"],
  },
  {
    dateLabel: "May 28",
    title: "Companies Participating in the 23rd Annual Craig-Hallum Institutional Investor Conference",
    summary:
      "The Craig-Hallum event is scheduled for Thursday, May 28 in Minneapolis and focuses on small- and mid-cap equities through management meetings and investor discussions.",
    tickers: ["MDXG", "PYPD", "CREX", "SWIM", "ALTO", "AIOT"],
  },
  {
    dateLabel: "May 26–27",
    title: "Companies Participating in the TD Cowen 7th Annual Oncology Innovation Summit",
    summary:
      "The TD Cowen Oncology Innovation Summit is scheduled across May 26–27, with ASCO and EHA-related sessions, oncology updates, and investor-facing discussions.",
    tickers: ["ACRV", "PEPG", "TARA", "CCCC", "NUVB", "ZNTL", "WHWK"],
  },
  {
    dateLabel: "May 28",
    title: "Companies Participating in the Lytham Partners Spring 2026 Investor Conference",
    summary:
      "The Lytham Partners Spring 2026 Investor Conference is a virtual event on May 28 with webcast presentations, interactive sessions, and one-on-one investor meetings.",
    tickers: ["JAGX", "DYAI", "BFRI", "IPM", "CVKD", "SNES", "POCI", "AYTU"],
  },
  {
    dateLabel: "May 29–June 2",
    title: "Companies Presenting at the American Society of Clinical Oncology Annual Meeting",
    summary:
      "ASCO begins May 29 in Chicago with virtual attendance options. The program includes scientific abstracts, poster presentations, industry exhibits, Innovation Zone programming, and oncology-focused sessions.",
    tickers: [
      "ONCY",
      "BCTX",
      "BLRX",
      "CATX",
      "PLRX",
      "AUTL",
      "MBRX",
      "APRE",
      "CMPX",
      "BCYC",
      "FATE",
      "BYSI",
      "CCCC",
      "OABI",
      "CLRB",
      "BDTX",
      "REPL",
      "RNXT",
      "GNPX",
      "IMMP",
      "XBIO",
      "AGEN",
      "CRDF",
      "INO",
    ],
  },
];

const companyCatalystGroups: CatalystGroup[] = [
  {
    dateLabel: "May 25",
    items: [
      {
        ticker: "SXTP",
        text: "FDA objection window for Australian Chestnut Extract dietary supplement notification was noted as May 25.",
      },
    ],
  },
  {
    dateLabel: "May 26",
    items: [
      {
        ticker: "BGL",
        text: "Investor webinar at 11:00 a.m. ET covering the mine-to-wallet strategy and STANDARD wallet ecosystem.",
      },
      {
        ticker: "HITI",
        text: "Management participation at Cannabis Europa in London on M&A deal flow and due diligence.",
      },
      {
        ticker: "STSS",
        text: "Solana infrastructure collaboration update and Innovate Miami event participation.",
      },
      {
        ticker: "OCGN",
        text: "Stifel 2026 Virtual Ophthalmology Forum presentation scheduled for 10:30–10:55 a.m. EDT.",
      },
      {
        ticker: "SGHT",
        text: "Stifel 2026 Virtual Ophthalmology Forum participation at 9:00 a.m. PT / 12:00 p.m. ET.",
      },
    ],
  },
  {
    dateLabel: "May 26–28",
    items: [
      {
        ticker: "PROP",
        text: "Senior management participation at the 26th Annual Louisiana Energy Conference in New Orleans.",
      },
    ],
  },
  {
    dateLabel: "May 26–29",
    items: [
      {
        ticker: "LPCN",
        text: "Phase 3 LPCN-1154 clinical data selected for oral and poster presentations at the ASCP Annual Meeting.",
      },
    ],
  },
  {
    dateLabel: "May 27",
    items: [
      {
        ticker: "EQ",
        text: "Virtual investor event at 11:00 a.m. ET featuring new preclinical AhR data.",
      },
      {
        ticker: "FRMM",
        text: "Management participation in Benchmark’s Digital Assets Summit in New York.",
      },
      {
        ticker: "HTOO",
        text: "Investor update video and presentation covering operations, milestones, and Royal Uranium acquisition agreement.",
      },
      {
        ticker: "GTN",
        text: "Participation in the Goldman Sachs Leveraged Finance Conference.",
      },
      {
        ticker: "TBLA",
        text: "TD Cowen TMT Conference fireside chat scheduled for 3:35 p.m. ET.",
      },
      {
        ticker: "HYPD",
        text: "Participation in Chardan’s Crypto Salon in New York.",
      },
      {
        ticker: "RMNI",
        text: "Participation in TD Cowen’s Technology, Media & Telecom Conference.",
      },
      {
        ticker: "KOPN",
        text: "Minneapolis Technology Demo Day as part of its 2026 Technology Demo Days Tour.",
      },
    ],
  },
  {
    dateLabel: "May 27–28",
    items: [
      {
        ticker: "HOVR",
        text: "Participation in CANSEC 2026 in Ottawa.",
      },
    ],
  },
  {
    dateLabel: "May 27–29",
    items: [
      {
        ticker: "CFND",
        text: "Benchmark Digital Assets Summit on May 27 followed by a non-deal roadshow in New York City on May 28–29.",
      },
      {
        ticker: "MOLN",
        text: "Antibody & Engineering Therapeutics presentation window, with a specific May 29 presentation scheduled for 4:45–5:15 p.m. local time.",
      },
    ],
  },
  {
    dateLabel: "May 28",
    items: [
      {
        ticker: "NCPL",
        text: "Business update conference call at 4:30 p.m. ET covering strategic direction and near-term priorities.",
      },
      {
        ticker: "FFAI",
        text: "Presentation and investor meetings at the Centurion One Capital Miami Summit.",
      },
      {
        ticker: "WETO",
        text: "Inaugural Austin product launch event for Orchestra, the company’s Physical AI operating system.",
      },
      {
        ticker: "OABI",
        text: "Virtual one-on-one and small group meetings at Benchmark’s Healthcare House Call Virtual Investor Conference.",
      },
    ],
  },
  {
    dateLabel: "May 29",
    items: [
      {
        ticker: "NWL",
        text: "Record date for quarterly cash dividend payable June 15.",
      },
      {
        ticker: "MNKD",
        text: "Afrezza pediatric indication PDUFA target action date.",
      },
      {
        ticker: "STKE",
        text: "Expected outside closing date for the HoudiniSwap acquisition, subject to customary conditions.",
      },
    ],
  },
  {
    dateLabel: "May 30",
    items: [
      {
        ticker: "TOMZ",
        text: "Definitive merger agreements expected on or before May 30, subject to due diligence and stockholder approval.",
      },
      {
        ticker: "LBGJ",
        text: "Expected outside closing date for acquisition of a 51% equity interest in Suzhou Yufengyuan.",
      },
    ],
  },
  {
    dateLabel: "May 30–June 2",
    items: [
      {
        ticker: "ATNM",
        text: "Three SNMMI abstracts, including a May 31 evening presentation.",
      },
    ],
  },
  {
    dateLabel: "May 31",
    items: [
      {
        ticker: "ALP",
        text: "GAMEE acquisition projected to close by May 31 pending final audits.",
      },
      {
        ticker: "DGNX",
        text: "Extended outside date for proposed all-share acquisition of Resulticks.",
      },
    ],
  },
  {
    dateLabel: "May 31–June 4",
    items: [
      {
        ticker: "BCHT",
        text: "American Society for Mass Spectrometry conference participation, including a May 31 user group meeting and June 3 poster Q&A.",
      },
    ],
  },
];

function getStructuredWeekAheadContent(
  article: BigTimePennyArticle,
): StructuredWeekAheadContent {
  if (article.structuredContent) {
    return article.structuredContent;
  }

  return {
    companyCatalysts: companyCatalystGroups,
    conferenceEvents: conferenceEventGroups,
    dateRange: "May 26–29",
    riskNotes: article.riskNotes,
    title: getDisplayTitle(article),
    version: 1,
  };
}

function formatArticleDate(article: BigTimePennyArticle): string {
  return getPublicCatalystArticleDate(article);
}

function getDisplayTitle(article: BigTimePennyArticle): string {
  return getPublicCatalystArticleTitle(article);
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
      <div className="news-card-heading">
        <h2 className="news-card-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TextList({
  empty,
  items,
  maxItems,
}: {
  empty: string;
  items: string[];
  maxItems?: number;
}) {
  const visibleItems = typeof maxItems === "number" ? items.slice(0, maxItems) : items;

  if (visibleItems.length === 0) {
    return <p className="news-muted">{empty}</p>;
  }

  return (
    <ul className="news-bullet-list">
      {visibleItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function StructuredWeekAheadArticle({
  content,
}: {
  content: StructuredWeekAheadContent;
}) {
  return (
    <div className="catalyst-article-body">
      <section className="catalyst-week-section catalyst-week-section-divided">
        <div className="catalyst-section-divider" aria-hidden="true" />
        <h2>Upcoming Conferences and Investor Events</h2>
        <div className="catalyst-event-list catalyst-list-no-first-border">
          {content.conferenceEvents.map((eventGroup, eventIndex) => (
            <article
              className="catalyst-event-item"
              key={`${eventGroup.dateLabel}-${eventGroup.title}-${eventIndex}`}
            >
              <div className="catalyst-event-date">{eventGroup.dateLabel}</div>
              <div>
                <h3>{eventGroup.title}</h3>
                <p>{eventGroup.summary}</p>
                <TickerList tickers={eventGroup.tickers} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="catalyst-week-section catalyst-week-section-divided">
        <div className="catalyst-section-divider" aria-hidden="true" />
        <h2>Company-Specific Catalysts</h2>
        <div className="catalyst-date-list catalyst-list-no-first-border">
          {content.companyCatalysts.map((group, groupIndex) => (
            <section
              className="catalyst-date-group"
              key={`${group.dateLabel}-${groupIndex}`}
            >
              <h3>{group.dateLabel}</h3>
              <ul>
                {group.items.map((item, itemIndex) => (
                  <li key={`${group.dateLabel}-${item.ticker}-${itemIndex}`}>
                    <strong>{item.ticker}</strong> - {item.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function TickerList({ tickers }: { tickers: string[] }) {
  return (
    <div className="catalyst-ticker-list" aria-label="Symbols">
      {tickers.map((ticker) => (
        <strong className="catalyst-ticker" key={ticker}>
          {ticker}
        </strong>
      ))}
    </div>
  );
}

export function generateStaticParams() {
  return listBigTimePennyArticles().map((article) => ({
    slug: article.publicSlug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBigTimePennyArticle(slug);

  if (!article) {
    return {
      title: "Catalyst Article Not Found | TradersLink",
    };
  }

  return {
    alternates: {
      canonical: article.publicPath,
    },
    description:
      "Trader-focused small-cap catalyst calendar and risk notes from TradersLink.",
    openGraph: {
      description:
        "Trader-focused small-cap catalyst calendar and risk notes from TradersLink.",
      publishedTime: article.aiProcessedAt || article.scrapedAt,
      title: getDisplayTitle(article),
      type: "article",
    },
    title: `${getDisplayTitle(article)} | TradersLink News`,
  };
}

export default async function BigTimePennyArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getBigTimePennyArticle(slug);

  if (!article) {
    notFound();
  }

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
  const displayTitle = getDisplayTitle(article);
  const structuredContent = getStructuredWeekAheadContent(article);

  return (
    <SiteShell shellElement="div">
      <main className="academy-container news-article-page catalyst-article-page">
        <div className="news-article-stack">
          <header className="news-surface-card news-article-header-card">
            <div className="news-article-header-copy">
              <div className="news-chip-row">
                <span className="news-chip">{formatArticleDate(article)}</span>
              </div>
              <h1 className="news-article-title">{displayTitle}</h1>
            </div>
          </header>

          <div className="news-dashboard-grid">
            <div className="news-main-stack">
              <SectionCard className="catalyst-week-ahead-card" title="The Week Ahead">
                <StructuredWeekAheadArticle content={structuredContent} />
              </SectionCard>

              <SectionCard title="Risk Notes">
                <TextList
                  empty="No separate risk notes were stored with this article."
                  items={
                    structuredContent.riskNotes.length > 0
                      ? structuredContent.riskNotes
                      : article.riskNotes
                  }
                />
              </SectionCard>
            </div>

            <aside className="news-sidebar-stack">
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
      </main>
    </SiteShell>
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
