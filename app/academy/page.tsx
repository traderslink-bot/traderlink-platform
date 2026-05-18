import Link from "next/link";

import {
  getAcademyCourses,
  getAcademyPathHubs,
} from "@/src/lib/academy/academy-content";

export const metadata = {
  title: "TradersLink Academy",
  description:
    "A structured trading education path with courses, lessons, market context, risk planning, review practice, and realistic chart-learning support.",
};

export default function AcademyHomePage() {
  const courses = getAcademyCourses();
  const pathHubs = getAcademyPathHubs();
  const requiredLessons = courses
    .map((course) => course.progress_model.match(/\/\s*(\d+)/)?.[1])
    .map((count) => Number(count ?? 0))
    .reduce((total, count) => total + count, 0);

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <section className="border-b border-cyan-200/10 bg-[linear-gradient(180deg,rgba(7,59,120,0.36),rgba(5,10,20,1))]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              TradersLink Academy
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-6xl">
              Structured trading education built as courses, lessons, and guided paths.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Learn chart reading, risk planning, filings, trading styles,
              discipline, and review practice in an order that makes sense,
              while still being free to jump into the lesson you need.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Courses" value={courses.length.toString()} />
            <StatCard label="Core lessons planned" value={`${requiredLessons}+`} />
            <StatCard label="Guided paths" value={pathHubs.length.toString()} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_21rem] lg:px-10">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Courses
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                Academy Course Index
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.course_id}
                href={course.course_slug}
                className="group rounded-lg border border-white/10 bg-slate-900/72 p-5 transition hover:border-cyan-200/50 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-400">
                    Course {course.course_order}
                  </p>
                  <span className="rounded border border-cyan-200/20 px-2 py-1 text-xs font-medium text-cyan-100">
                    {course.app_bridge_strength}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-normal text-white group-hover:text-cyan-100">
                  {course.course_title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {course.display_model}
                </p>
                <p className="mt-5 text-sm font-medium text-cyan-200">
                  Open course
                </p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
            <h2 className="text-lg font-semibold tracking-normal">
              Guided Paths
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Focused routes combine courses and key lessons around a practical
              learning goal.
            </p>
          </div>

          {pathHubs.map((hub) => (
            <Link
              key={hub.path_id}
              href={`/academy/paths/${hub.path_id}/`}
              className="block rounded-lg border border-white/10 bg-slate-900/72 p-5 transition hover:border-cyan-200/50"
            >
              <p className="text-sm text-cyan-200">Path {hub.display_order}</p>
              <h3 className="mt-2 font-semibold tracking-normal text-white">
                {hub.path_title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {hub.recommended_for}
              </p>
            </Link>
          ))}
        </aside>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/54 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-cyan-100">
        {value}
      </p>
    </div>
  );
}
