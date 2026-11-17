import { setTimeout as delay } from "node:timers/promises";
import type { ScreenerProviderSelection } from "./contracts";

type Options = {
  selection(signal: AbortSignal): Promise<ScreenerProviderSelection>;
  run(selection: ScreenerProviderSelection, signal: AbortSignal): Promise<void>;
  signal: AbortSignal;
  onError?: () => void;
};

/** A changed revision cancels both collection and publishing for the prior selection. */
export async function runScreenerProviderWorker(options: Options) {
  let active: { selection: ScreenerProviderSelection; controller: AbortController; task: Promise<void> } | undefined;
  let retryAfter = 0;
  try {
    while (!options.signal.aborted) {
      try {
        const selection = await options.selection(options.signal);
        if (active && (active.selection.provider !== selection.provider || active.selection.revision !== selection.revision)) {
          active.controller.abort();
          active = undefined;
          retryAfter = 0;
        }
        if (!active && Date.now() >= retryAfter && !options.signal.aborted) {
          const controller = new AbortController();
          const signal = AbortSignal.any([controller.signal, options.signal]);
          const worker = { selection, controller, task: Promise.resolve() };
          active = worker;
          worker.task = Promise.resolve().then(() => options.run(selection, signal)).catch(() => {
            if (!signal.aborted) options.onError?.();
          }).finally(() => {
            if (active === worker) {
              active = undefined;
              retryAfter = Date.now() + 5_000;
            }
          });
        }
      } catch {
        if (!options.signal.aborted) options.onError?.();
      }
      await delay(1_000, undefined, { signal: options.signal }).catch(() => {});
    }
  } finally {
    active?.controller.abort();
    await active?.task;
  }
}
