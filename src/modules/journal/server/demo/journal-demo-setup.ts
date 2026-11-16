import { join } from "node:path";
import { Worker } from "node:worker_threads";

import type { DemoSetupCommand, DemoSetupResult } from "./journal-demo-setup-worker";

const slot = Symbol.for("traderlink.journal.demo.setup");
const state = globalThis as typeof globalThis & { [slot]?: Promise<unknown> };

/** Keep one SQLite demo writer per web process. Clients retry after contention. */
export function runJournalDemoSetup<Command extends DemoSetupCommand>(
  command: Command,
): Promise<DemoSetupResult[Command["operation"]] | null> {
  if (state[slot]) return Promise.resolve(null);
  const worker = new Worker(join(process.cwd(), "workers/journal-demo-setup.cjs"), {
    workerData: command,
  });
  const completion = new Promise<DemoSetupResult[Command["operation"]]>((resolve, reject) => {
    let result: DemoSetupResult[Command["operation"]] | undefined;
    worker.on("message", message => { result = message; });
    worker.once("error", reject);
    worker.once("exit", code => {
      delete state[slot];
      if (code === 0 && result) resolve(result);
      else reject(new Error("journal_demo_setup_failed"));
    });
  });
  state[slot] = completion;
  return completion;
}
