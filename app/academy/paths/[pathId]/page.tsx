import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAcademyPathHubIds,
  getAcademyPathHubPage,
} from "@/src/lib/academy/academy-content";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

export function generateStaticParams() {
  return getAcademyPathHubIds().map((pathId) => ({ pathId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { pathId } = await params;
  const page = getAcademyPathHubPage(pathId);

  if (!page) {
    return {
      title: "Academy Path",
    };
  }

  return {
    title: `${page.hub.path_title} | TradersLink Academy`,
    description: page.hub.path_goal,
  };
}

export default async function AcademyPathPage({ params }: PageProps) {
  const { pathId } = await params;
  const page = getAcademyPathHubPage(pathId);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
        <Link href="/academy/" className="text-sm font-medium text-cyan-200">
          Academy
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Guided Path
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            {page.hub.path_title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-200">
            {page.hub.path_goal}
          </p>
          <p className="mt-3 text-base leading-7 text-slate-300">
            {page.hub.recommended_for}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          {page.steps.map((item) => {
            const href =
              item.type === "course"
                ? item.course.course_slug
                : item.lesson.slug;
            const title =
              item.type === "course"
                ? item.course.course_title
                : item.lesson.title;
            const label = item.type === "course" ? "Course" : "Lesson";

            return (
              <Link
                key={item.step.step_id}
                href={href}
                className="grid gap-4 rounded-lg border border-white/10 bg-slate-900/72 p-5 transition hover:border-cyan-200/50 sm:grid-cols-[4rem_1fr_auto]"
              >
                <span className="text-2xl font-semibold text-cyan-100">
                  {item.step.step_order}
                </span>
                <span>
                  <span className="block text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {label}
                  </span>
                  <span className="mt-2 block text-xl font-semibold tracking-normal text-white">
                    {title}
                  </span>
                </span>
                <span className="text-sm font-medium text-cyan-200">Open</span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
