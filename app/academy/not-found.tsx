import Link from "next/link";

export default function AcademyNotFound() {
  return (
    <main className="min-h-screen bg-[#050a14] px-5 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-lg border border-white/10 bg-slate-900/72 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
          TradersLink Academy
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Lesson not found
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-300">
          This Academy route is not in the current content registry.
        </p>
        <Link
          href="/academy/"
          className="mt-6 inline-flex rounded border border-cyan-200/30 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          Return to Academy
        </Link>
      </div>
    </main>
  );
}
