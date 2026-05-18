import Link from "next/link";

import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";

export const metadata = {
  title: "TradersLink Academy",
  description:
    "A structured trading education path with courses, lessons, market context, risk planning, review practice, and realistic chart-learning support.",
};

export default function AcademyHomePage() {
  const courses = getAcademyCourses();
  const [liveCourseId] = getLaunchAcademyCourseIds();
  const liveCourse = courses.find((course) => course.course_id === liveCourseId);
  const liveCoursePage = liveCourse ? getAcademyCoursePage(liveCourseId) : null;
  const comingSoonCourses = courses.filter(
    (course) => course.course_id !== liveCourseId,
  );

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <section className="border-b border-cyan-200/10 bg-[linear-gradient(180deg,rgba(7,59,120,0.36),rgba(5,10,20,1))]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              TradersLink Academy
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-6xl">
              Start with chart reading, market structure, and real lesson-by-lesson progress.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              The first Academy course is open now. It gives new traders a
              clear course sequence through candlesticks, levels, structure,
              breaks, ranges, and chart-pattern context without locking them
              into the order.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Live course" value="1" />
            <StatCard
              label="Lessons"
              value={(liveCoursePage?.totalLessonCount ?? 51).toString()}
            />
            <StatCard
              label="Coming soon"
              value={comingSoonCourses.length.toString()}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:px-10">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                Available Now
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                Begin The Academy Path
              </h2>
            </div>
          </div>

          {liveCourse ? (
            <div className="grid gap-4">
              <Link
                href={liveCourse.course_slug}
                className="group rounded-lg border border-cyan-200/30 bg-slate-900/72 p-6 transition hover:border-cyan-200/60 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                    Course {liveCourse.course_order}
                  </p>
                  <span className="rounded border border-emerald-200/30 bg-emerald-300/10 px-2 py-1 text-xs font-medium text-emerald-100">
                    Open now
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-normal text-white group-hover:text-cyan-100">
                  {liveCourse.course_title}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  {liveCourse.course_outcome || liveCourse.display_model}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded border border-white/10 bg-white/5 px-3 py-2">
                    {liveCoursePage?.totalLessonCount ?? 51} lessons
                  </span>
                </div>
                <p className="mt-6 text-sm font-semibold text-cyan-200">
                  Open course
                </p>
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
            <h2 className="text-lg font-semibold tracking-normal">
              Coming Soon
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              These courses stay in planning until their content and visuals
              are ready for the same standard as the first course.
            </p>
          </div>

          {comingSoonCourses.map((course) => (
            <div
              key={course.course_id}
              className="rounded-lg border border-white/10 bg-slate-900/72 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Course {course.course_order}
                </p>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-300">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-3 font-semibold tracking-normal text-white">
                {course.course_title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {course.display_model}
              </p>
            </div>
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
