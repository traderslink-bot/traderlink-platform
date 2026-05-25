export default function LoadingTickerStory() {
  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="ti-hero-surface p-5">
          <div className="h-4 w-40 animate-pulse bg-zinc-800" />
          <div className="mt-5 h-10 w-full max-w-xl animate-pulse bg-zinc-800" />
          <div className="mt-3 h-4 w-full max-w-3xl animate-pulse bg-zinc-900" />
        </section>
        <section className="ti-panel p-5">
          <div className="h-6 w-48 animate-pulse bg-zinc-800" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="h-24 animate-pulse bg-zinc-900" />
            <div className="h-24 animate-pulse bg-zinc-900" />
          </div>
        </section>
      </div>
    </main>
  );
}
