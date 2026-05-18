"use client";

import { useEffect, useMemo, useState } from "react";

const storageKey = "traderslink.academy.completedLessons.v1";

type ProgressState = {
  completed: Set<string>;
  hydrated: boolean;
};

export function AcademyLessonCompleteControl({
  lessonSlug,
}: {
  lessonSlug: string;
}) {
  const [state, setState] = useAcademyProgress();
  const isComplete = state.completed.has(lessonSlug);

  return (
    <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
      <h2 className="text-lg font-semibold tracking-normal">Lesson Progress</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Track this lesson on this device. Account sync can be added later when
        the Academy progress store is connected.
      </p>
      <button
        type="button"
        onClick={() =>
          setLessonComplete(lessonSlug, !isComplete, state.completed, setState)
        }
        className="mt-4 w-full rounded border border-cyan-200/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
      >
        {isComplete ? "Completed" : "Mark Complete"}
      </button>
      {!state.hydrated ? (
        <p className="mt-3 text-xs text-slate-500">Loading local progress...</p>
      ) : null}
    </div>
  );
}

export function AcademyCourseProgressSummary({
  guidedPathLessonSlugs,
  totalLessonCount,
}: {
  guidedPathLessonSlugs: string[];
  totalLessonCount: number;
}) {
  const [state] = useAcademyProgress();
  const completedGuidedPath = guidedPathLessonSlugs.filter((slug) =>
    state.completed.has(slug),
  ).length;
  const percent =
    guidedPathLessonSlugs.length === 0
      ? 0
      : Math.round((completedGuidedPath / guidedPathLessonSlugs.length) * 100);

  return (
    <div className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-5">
      <h2 className="text-lg font-semibold tracking-normal">
        Local Course Progress
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {completedGuidedPath} of {guidedPathLessonSlugs.length} guided path
        lessons completed on this device.
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded bg-slate-950">
        <div
          className="h-full bg-cyan-300 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{percent}% complete</span>
        <span>{totalLessonCount} lessons listed</span>
      </div>
    </div>
  );
}

export function AcademyLessonStatus({
  lessonSlug,
}: {
  lessonSlug: string;
}) {
  const [state] = useAcademyProgress();
  const isComplete = state.completed.has(lessonSlug);

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 text-xs font-medium ${
        isComplete
          ? "border-emerald-200/30 bg-emerald-300/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-400"
      }`}
    >
      {isComplete ? "Complete" : "Incomplete"}
    </span>
  );
}

function useAcademyProgress(): [
  ProgressState,
  (state: ProgressState) => void,
] {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setCompletedLessons(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCompletedLessons([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  const state = useMemo<ProgressState>(
    () => ({
      completed: new Set(completedLessons),
      hydrated,
    }),
    [completedLessons, hydrated],
  );

  function setState(nextState: ProgressState) {
    const nextLessons = [...nextState.completed].toSorted();
    setCompletedLessons(nextLessons);
    window.localStorage.setItem(storageKey, JSON.stringify(nextLessons));
  }

  return [state, setState];
}

function setLessonComplete(
  lessonSlug: string,
  complete: boolean,
  current: Set<string>,
  setState: (state: ProgressState) => void,
) {
  const nextCompleted = new Set(current);

  if (complete) {
    nextCompleted.add(lessonSlug);
  } else {
    nextCompleted.delete(lessonSlug);
  }

  setState({
    completed: nextCompleted,
    hydrated: true,
  });
}
