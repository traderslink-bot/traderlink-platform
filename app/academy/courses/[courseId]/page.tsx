import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AcademyShell } from "../../academy-shell";
import { getCurrentAcademySession } from "../../academy-server-session";
import {
  getAcademyCoursePage,
  getLaunchAcademyCourseIds,
  isAcademyCourseLaunchReady,
} from "@/src/lib/academy/academy-content";
import { AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
import {
  buildAcademyMetadata,
  buildCourseJsonLd,
  getAcademyCourseSeoDescription,
  jsonLdScript,
} from "@/src/lib/academy/academy-seo";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

const candlestickModuleIds = new Set([
  "bullish-candle-patterns",
  "bearish-candle-patterns",
  "indecision-neutral-candles",
  "momentum-continuation-candles",
  "session-gap-behavior",
]);
const chartPatternModuleIds = new Set(["chart-patterns-context"]);

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getLaunchAcademyCourseIds().map((courseId) => ({ courseId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const page = getAcademyCoursePage(courseId);

  if (!page || !isAcademyCourseLaunchReady(courseId)) {
    return buildAcademyMetadata({
      title: "Academy Course",
      description: "A TradersLink Academy course for structured trading education.",
      pathname: "/academy/",
      noIndex: true,
    });
  }

  return buildAcademyMetadata({
    title: page.course.course_title,
    description: getAcademyCourseSeoDescription(page.course),
    pathname: page.course.course_slug,
  });
}

export default async function AcademyCoursePage({ params }: PageProps) {
  const { courseId } = await params;
  const page = getAcademyCoursePage(courseId);

  if (!page || !isAcademyCourseLaunchReady(courseId)) {
    notFound();
  }

  const academySession = await getCurrentAcademySession();
  const completedLessonSlugs = academySession
    ? new Set(
        await new AcademyProgressStore().listCompletedLessonSlugs(
          academySession.discordUserId,
        ),
      )
    : new Set<string>();
  const { course, modules, previousCourse, nextCourse } = page;
  const allLessons = modules.flatMap(({ lessons }) => lessons);
  const coreLessonCount = allLessons.filter(
    (lesson) =>
      lesson.counts_toward_course_progress &&
      !candlestickModuleIds.has(lesson.module_id) &&
      !chartPatternModuleIds.has(lesson.module_id),
  ).length;
  const candlestickLessonCount = allLessons.filter((lesson) =>
    candlestickModuleIds.has(lesson.module_id),
  ).length;
  const chartPatternLessonCount = allLessons.filter((lesson) =>
    chartPatternModuleIds.has(lesson.module_id),
  ).length;
  const hasSpecializedLessonGroups =
    candlestickLessonCount > 0 || chartPatternLessonCount > 0;
  const firstCoreLesson = allLessons.find(
    (lesson) => lesson.counts_toward_course_progress,
  );
  const previousCourseIsOpen = previousCourse
    ? isAcademyCourseLaunchReady(previousCourse.course_id)
    : false;
  const nextCourseIsOpen = nextCourse
    ? isAcademyCourseLaunchReady(nextCourse.course_id)
    : false;
  const courseJsonLd = buildCourseJsonLd(course);

  return (
    <AcademyShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(courseJsonLd)}
      />
      <div className="academy-container">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">Course {course.course_order}</p>
            <h1 className="academy-title-sm">{course.course_title}</h1>
            <p className="academy-lede">{course.display_model}</p>

            <div className="academy-chip-row">
              <span className="academy-chip">
                {coreLessonCount} core lessons
              </span>
              {candlestickLessonCount > 0 ? (
                <span className="academy-chip">
                  {candlestickLessonCount} candlestick lessons
                </span>
              ) : null}
              {chartPatternLessonCount > 0 ? (
                <span className="academy-chip">
                  {chartPatternLessonCount} chart pattern lessons
                </span>
              ) : null}
            </div>

            {firstCoreLesson ? (
              <div className="academy-chip-row">
                <Link
                  href={firstCoreLesson.lesson_slug}
                  className="academy-button"
                >
                  Start Course
                </Link>
                <Link
                  href="/academy/"
                  className="academy-button academy-button-secondary"
                >
                  Academy Home
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="academy-section">
          <p className="academy-body-copy">
            {hasSpecializedLessonGroups
              ? "Start with the guided core path, then use the candlestick and chart-pattern lessons when you want to study a specific candle, behavior, or pattern."
              : "Start with the guided core path and move lesson by lesson. This course is intentionally focused on the first concepts a new trader needs before studying chart structure, volume, risk planning, or advanced workflows."}
          </p>

          <div className="academy-module-list">
            {modules.map(({ module, lessons }) => (
              <div key={module.module_id} className="academy-module-card">
                <div className="academy-module-header">
                  <div className="academy-module-heading">
                    <p className="academy-kicker">
                      Module {module.module_order}
                    </p>
                    <h2 className="academy-module-title">
                      {module.module_title}
                    </h2>
                  </div>
                  <span className="academy-module-progress-badge">
                    Completed{" "}
                    {
                      lessons.filter((lesson) =>
                        completedLessonSlugs.has(lesson.lesson_slug),
                      ).length
                    }
                    /{lessons.length}
                  </span>
                </div>

                <div className="academy-lesson-list">
                  {lessons.map((lesson) => (
                    <Link
                      key={`${lesson.display_course_id}-${lesson.lesson_slug}-${lesson.display_order}`}
                      href={lesson.lesson_slug}
                      className="academy-lesson-row"
                    >
                      <span className="academy-lesson-number">
                        {lesson.display_order}
                      </span>
                      <span>
                        <span className="academy-lesson-title">
                          {lesson.display_title}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <nav className="academy-nav-grid">
          {previousCourse ? (
            <Link
              href={
                previousCourseIsOpen
                  ? previousCourse.course_slug
                  : course.course_slug
              }
              aria-disabled={!previousCourseIsOpen}
              className="academy-nav-card"
            >
              <p className="academy-nav-label">Previous course</p>
              <p className="academy-nav-title">{previousCourse.course_title}</p>
              {previousCourseIsOpen ? null : (
                <p className="academy-card-text">Coming soon</p>
              )}
            </Link>
          ) : null}
          {nextCourse ? (
            <Link
              href={nextCourseIsOpen ? nextCourse.course_slug : course.course_slug}
              aria-disabled={!nextCourseIsOpen}
              className="academy-nav-card"
            >
              <p className="academy-nav-label">Next course</p>
              <p className="academy-nav-title">{nextCourse.course_title}</p>
              {nextCourseIsOpen ? null : (
                <p className="academy-card-text">Coming soon</p>
              )}
            </Link>
          ) : null}
        </nav>
      </div>
    </AcademyShell>
  );
}
