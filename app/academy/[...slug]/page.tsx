import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAcademyAppBridgeForLesson,
  getAcademyCoursePage,
  getAcademyLessonBySegments,
  getAcademyLessonStaticParams,
} from "@/src/lib/academy/academy-content";
import { AcademyMarkdown } from "@/src/lib/academy/academy-markdown";
import { AcademyLessonCompleteControl } from "@/src/lib/academy/academy-progress";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return getAcademyLessonStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getAcademyLessonBySegments(slug);

  if (!lesson) {
    return {
      title: "Academy Lesson",
    };
  }

  return {
    title: `${lesson.title} | TradersLink Academy`,
    description: lesson.description,
  };
}

export default async function AcademyLessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = getAcademyLessonBySegments(slug);

  if (!lesson) {
    notFound();
  }

  const bridge = getAcademyAppBridgeForLesson(lesson);
  const primaryContext = lesson.contexts[0] ?? null;
  const primaryCoursePage = primaryContext
    ? getAcademyCoursePage(primaryContext.courseId)
    : null;
  const courseLessons = primaryCoursePage
    ? primaryCoursePage.modules.flatMap(({ lessons }) => lessons)
    : [];

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-10">
        <article className="min-w-0">
          <Link href="/academy/" className="text-sm font-medium text-cyan-200">
            Academy
          </Link>

          <div className="mt-8 rounded-lg border border-white/10 bg-slate-900/58 p-5 sm:p-8">
            <AcademyMarkdown body={lesson.body} />
          </div>

          <nav className="mt-6 grid gap-4 sm:grid-cols-2">
            {lesson.previousLesson ? (
              <Link
                href={lesson.previousLesson.slug}
                className="rounded-lg border border-white/10 bg-slate-900/72 p-5 transition hover:border-cyan-200/50"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Previous lesson
                </p>
                <p className="mt-3 text-lg font-semibold tracking-normal text-cyan-100">
                  {lesson.previousLesson.title}
                </p>
              </Link>
            ) : (
              <Link
                href="/academy/"
                className="rounded-lg border border-white/10 bg-slate-900/72 p-5 transition hover:border-cyan-200/50"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Academy home
                </p>
                <p className="mt-3 text-lg font-semibold tracking-normal text-cyan-100">
                  View all courses
                </p>
              </Link>
            )}

            {lesson.nextLesson ? (
              <Link
                href={lesson.nextLesson.slug}
                className="rounded-lg border border-cyan-200/30 bg-cyan-300/10 p-5 text-left transition hover:bg-cyan-300/20 sm:text-right"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">
                  Next lesson
                </p>
                <p className="mt-3 text-lg font-semibold tracking-normal text-white">
                  {lesson.nextLesson.title}
                </p>
              </Link>
            ) : (
              <Link
                href="/academy/"
                className="rounded-lg border border-cyan-200/30 bg-cyan-300/10 p-5 text-left transition hover:bg-cyan-300/20 sm:text-right"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">
                  Course complete
                </p>
                <p className="mt-3 text-lg font-semibold tracking-normal text-white">
                  Return to Academy
                </p>
              </Link>
            )}
          </nav>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <AcademyLessonCompleteControl lessonSlug={lesson.slug} />

          {primaryContext ? (
            <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Course Context
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-normal">
                {primaryContext.courseTitle}
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                <p>{primaryContext.moduleTitle}</p>
                <p>
                  Lesson {primaryContext.displayOrder} -{" "}
                  {primaryContext.requiredForCoreCompletion
                    ? "required"
                    : "optional"}
                </p>
              </div>
              <Link
                href={primaryContext.courseSlug}
                className="mt-4 inline-flex rounded border border-cyan-200/30 px-3 py-2 text-sm font-semibold text-cyan-100"
              >
                View course
              </Link>
            </div>
          ) : null}

          {lesson.memberships.length > 1 ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Also Appears In
              </h2>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {lesson.contexts.map((context) => (
                  <Link
                    key={`${context.courseId}-${context.moduleId}`}
                    href={context.courseSlug}
                    className="block rounded border border-white/10 px-3 py-2 transition hover:border-cyan-200/40"
                  >
                    <span className="block font-medium text-slate-100">
                      {context.courseTitle}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {context.moduleTitle}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {courseLessons.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Course Lessons
              </h2>
              <div className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1 text-sm">
                {courseLessons.map((courseLesson) => {
                  const isCurrent = courseLesson.lesson_slug === lesson.slug;

                  return (
                    <Link
                      key={`${courseLesson.display_course_id}-${courseLesson.lesson_slug}-${courseLesson.display_order}`}
                      href={courseLesson.lesson_slug}
                      className={`block rounded border px-3 py-2 transition ${
                        isCurrent
                          ? "border-cyan-200/40 bg-cyan-300/10 text-cyan-50"
                          : "border-white/10 text-slate-300 hover:border-cyan-200/30"
                      }`}
                    >
                      <span className="block text-xs text-slate-500">
                        Lesson {courseLesson.display_order}
                      </span>
                      <span className="mt-1 block font-medium">
                        {courseLesson.display_title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {bridge ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Trader Intelligence Bridge
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {bridge.primary_surface} can connect this concept to completed
                trade review later. The Academy keeps the lesson educational,
                with no prediction, signal, or guaranteed outcome claim.
              </p>
            </div>
          ) : null}

        </aside>
      </div>
    </main>
  );
}
