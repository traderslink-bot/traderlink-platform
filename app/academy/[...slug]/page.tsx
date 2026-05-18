import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  type AcademyLessonMembership,
  type AcademyModule,
  getAcademyCoursePage,
  getAcademyLessonBySegments,
  getLaunchAcademyLessonStaticParams,
  isAcademyLessonLaunchReady,
} from "@/src/lib/academy/academy-content";
import { AcademyMarkdown } from "@/src/lib/academy/academy-markdown";
import { AcademyLessonCompleteControl } from "@/src/lib/academy/academy-progress";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLaunchAcademyLessonStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getAcademyLessonBySegments(slug);

  if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
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

  if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
    notFound();
  }

  const primaryContext = lesson.contexts[0] ?? null;
  const primaryCoursePage = primaryContext
    ? getAcademyCoursePage(primaryContext.courseId)
    : null;
  const courseModules = primaryCoursePage?.modules ?? [];
  const coreModules = courseModules.filter(
    ({ module }) => module.module_type !== "reference_library",
  );
  const referenceModules = courseModules.filter(
    ({ module }) => module.module_type === "reference_library",
  );
  const learningPathSection = splitLearningPathSection(lesson.body);

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-10">
        <article className="min-w-0">
          <Link href="/academy/" className="text-sm font-medium text-cyan-200">
            Academy
          </Link>

          <div className="mt-8 rounded-lg border border-white/10 bg-slate-900/58 p-5 sm:p-8">
            <AcademyMarkdown body={learningPathSection.mainBody} />
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

          {learningPathSection.learningPathBody ? (
            <div className="mt-6 rounded-lg border border-white/10 bg-slate-900/46 p-5 sm:p-8">
              <AcademyMarkdown body={learningPathSection.learningPathBody} />
            </div>
          ) : null}
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
                <p>Lesson {primaryContext.displayOrder}</p>
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

          {courseModules.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Course Path
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Move through the course in order, or jump to the lesson you
                need.
              </p>
              <div className="mt-4 max-h-[30rem] space-y-5 overflow-y-auto pr-1 text-sm">
                <CourseLessonGroups
                  currentSlug={lesson.slug}
                  groups={coreModules}
                  label="Course lessons"
                />
                <CourseLessonGroups
                  currentSlug={lesson.slug}
                  groups={referenceModules}
                  label="Reference library"
                />
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function CourseLessonGroups({
  currentSlug,
  groups,
  label,
}: {
  currentSlug: string;
  groups: Array<{ module: AcademyModule; lessons: AcademyLessonMembership[] }>;
  label: string;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {groups.map(({ module, lessons }) => (
        <div key={module.module_id} className="space-y-2">
          <p className="text-xs font-medium text-cyan-200">
            {module.module_title}
          </p>
          {lessons.map((courseLesson) => {
            const isCurrent = courseLesson.lesson_slug === currentSlug;

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
      ))}
    </div>
  );
}

function splitLearningPathSection(body: string): {
  mainBody: string;
  learningPathBody: string | null;
} {
  const heading = /^## Continue The Learning Path\s*$/m.exec(body);

  if (!heading) {
    return {
      mainBody: body,
      learningPathBody: null,
    };
  }

  const sectionStart = heading.index;
  const afterHeadingIndex = sectionStart + heading[0].length;
  const remainingBody = body.slice(afterHeadingIndex);
  const nextHeading = /^##\s+/m.exec(remainingBody);
  const sectionEnd = nextHeading
    ? afterHeadingIndex + nextHeading.index
    : body.length;
  const beforeSection = body.slice(0, sectionStart).trimEnd();
  const learningPathBody = body.slice(sectionStart, sectionEnd).trim();
  const afterSection = body.slice(sectionEnd).trimStart();
  const mainBody = [beforeSection, afterSection].filter(Boolean).join("\n\n");

  return {
    mainBody,
    learningPathBody,
  };
}
