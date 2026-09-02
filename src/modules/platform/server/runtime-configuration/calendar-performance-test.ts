import "server-only";

const CALENDAR_PERFORMANCE_TEST_DISABLE_ENV =
  "TRADERLINK_DISABLE_CALENDAR_FOR_PERFORMANCE_TEST";

/**
 * This is deliberately opt-in and production-controlled. It lets the release
 * owner isolate Calendar's first-load cost without deleting Calendar or
 * weakening any database/runtime checks.
 */
export function calendarDisabledForPerformanceTest(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[CALENDAR_PERFORMANCE_TEST_DISABLE_ENV]?.trim() === "true";
}
