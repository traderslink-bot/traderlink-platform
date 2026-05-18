import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAcademyAppBridgeForLesson,
  getAcademyLessonBySegments,
  getAcademyLessonStaticParams,
  getCourseTitle,
} from "@/src/lib/academy/academy-content";
import { AcademyMarkdown } from "@/src/lib/academy/academy-markdown";

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
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {lesson.canonicalMembership ? (
            <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Course Context
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-normal">
                {getCourseTitle(lesson.canonicalMembership.display_course_id)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {lesson.canonicalMembership.membership_type === "canonical"
                  ? "Core lesson"
                  : "Cross-listed lesson"}
              </p>
            </div>
          ) : null}

          {lesson.memberships.length > 1 ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Also Appears In
              </h2>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {lesson.memberships.map((membership) => (
                  <p key={`${membership.display_course_id}-${membership.module_id}`}>
                    {getCourseTitle(membership.display_course_id)}
                  </p>
                ))}
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

          {lesson.visualAssets.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-slate-900/72 p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                Visual Assets
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {lesson.visualAssets.map((asset) => (
                  <li key={asset} className="break-words">
                    {asset}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav className="grid gap-3">
            {lesson.previousLesson ? (
              <Link
                href={lesson.previousLesson.slug}
                className="rounded-lg border border-white/10 bg-slate-900/72 p-5"
              >
                <p className="text-sm text-slate-400">Previous lesson</p>
                <p className="mt-2 font-semibold text-cyan-100">
                  {lesson.previousLesson.title}
                </p>
              </Link>
            ) : null}
            {lesson.nextLesson ? (
              <Link
                href={lesson.nextLesson.slug}
                className="rounded-lg border border-white/10 bg-slate-900/72 p-5"
              >
                <p className="text-sm text-slate-400">Next lesson</p>
                <p className="mt-2 font-semibold text-cyan-100">
                  {lesson.nextLesson.title}
                </p>
              </Link>
            ) : null}
          </nav>
        </aside>
      </div>
    </main>
  );
}
