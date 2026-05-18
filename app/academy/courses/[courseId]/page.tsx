import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAcademyCoursePage,
  getLaunchAcademyCourseIds,
  isAcademyCourseLaunchReady,
} from "@/src/lib/academy/academy-content";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLaunchAcademyCourseIds().map((courseId) => ({ courseId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const page = getAcademyCoursePage(courseId);

  if (!page || !isAcademyCourseLaunchReady(courseId)) {
    return {
      title: "Academy Course",
    };
  }

  return {
    title: `${page.course.course_title} | TradersLink Academy`,
    description: page.course.display_model,
  };
}

export default async function AcademyCoursePage({ params }: PageProps) {
  const { courseId } = await params;
  const page = getAcademyCoursePage(courseId);

  if (!page || !isAcademyCourseLaunchReady(courseId)) {
    notFound();
  }

  const { course, modules, previousCourse, nextCourse } = page;
  const allLessons = modules.flatMap(({ lessons }) => lessons);
  const coreLessonCount = allLessons.filter(
    (lesson) => lesson.counts_toward_course_progress,
  ).length;
  const candlestickDeepDiveLessonCount = allLessons.filter(
    (lesson) =>
      lesson.module_id === "candlestick-patterns-context" &&
      lesson.completion_behavior === "library",
  ).length;
  const chartPatternDeepDiveLessonCount = allLessons.filter(
    (lesson) =>
      lesson.module_id === "chart-patterns-context" &&
      lesson.completion_behavior === "library",
  ).length;
  const deepDiveLessonCount =
    candlestickDeepDiveLessonCount + chartPatternDeepDiveLessonCount;
  const firstCoreLesson = allLessons.find(
    (lesson) => lesson.counts_toward_course_progress,
  );

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <Link href="/academy/" className="text-sm font-medium text-cyan-200">
          Academy
        </Link>

        <section className="mt-8">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Course {course.course_order}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              {course.course_title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              {course.display_model}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
                {coreLessonCount} core lessons + {deepDiveLessonCount}{" "}
                deep-dive lessons
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
                {candlestickDeepDiveLessonCount} candlestick deep-dive lessons
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
                {chartPatternDeepDiveLessonCount} chart-pattern deep-dive
                lessons
              </span>
            </div>

            {firstCoreLesson ? (
              <div className="mt-6">
                <Link
                  href={firstCoreLesson.lesson_slug}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#050a14]"
                >
                  Start Course
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <p className="max-w-3xl text-base leading-7 text-slate-300">
            Start with the guided core path, then use the candlestick and
            chart-pattern deep dives when you want to study a specific candle
            or pattern.
          </p>

          {modules.map(({ module, lessons }) => (
            <div
              key={module.module_id}
              className="rounded-lg border border-white/10 bg-slate-900/70"
            >
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-sm text-cyan-200">
                  Module {module.module_order}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                  {module.module_title}
                </h2>
              </div>

              <div className="divide-y divide-white/10">
                {lessons.map((lesson) => (
                  <Link
                    key={`${lesson.display_course_id}-${lesson.lesson_slug}-${lesson.display_order}`}
                    href={lesson.lesson_slug}
                    className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[3rem_1fr]"
                  >
                    <span className="text-sm text-slate-500">
                      {lesson.display_order}
                    </span>
                    <span>
                      <span className="block font-semibold tracking-normal text-white">
                        {lesson.display_title}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <nav className="mt-10 grid gap-4 sm:grid-cols-2">
          {previousCourse ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Previous course</p>
              <p className="mt-2 font-semibold text-slate-100">
                {previousCourse.course_title}
              </p>
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>
          ) : null}
          {nextCourse ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5 sm:text-right">
              <p className="text-sm text-slate-400">Next course</p>
              <p className="mt-2 font-semibold text-slate-100">
                {nextCourse.course_title}
              </p>
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
