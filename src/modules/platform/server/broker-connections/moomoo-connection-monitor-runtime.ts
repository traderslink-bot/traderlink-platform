import "server-only";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runMoomooConnectionMonitor } from "./moomoo-connection-monitor";

let started = false;
/** Called only by the existing hosted-workers entrypoint after readiness.
 * --no-workers never invokes that entrypoint. No extra server or timer in imports. */
export function startMoomooConnectionMonitor(): void {
  if (started) return;
  started = true;
  let running = false;
  let after = "";
  const tick = async () => {
    if (running) return;
    running = true;
    let db: ReturnType<typeof openPlatformDatabase> | undefined;
    try {
      db = openPlatformDatabase({ mode: "runtime" });
      const result = await runMoomooConnectionMonitor(db, { after, now: new Date() });
      after = result.after;
      if (result.unavailable) console.warn("Moomoo connection monitor will retry unavailable checks.", { count: result.unavailable });
    } catch {
      console.error("Moomoo connection monitor unavailable.");
    } finally {
      try { db?.close(); }
      catch { console.error("Moomoo connection monitor cleanup unavailable."); }
      finally { running = false; }
    }
  };
  // At most five sequential 15s provider requests per pass; no overlapping pass.
  setInterval(() => void tick(), 60_000).unref();
}
