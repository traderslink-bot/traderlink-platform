import "server-only";
import { mkdir, open, readFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "../database/platform-database-config";
import { admitMoomooRequest, recordMoomoo429, recordMoomooAccepted, reserveScannerDemand, restoreBudget,
  type MoomooBudgetState, type MoomooPriority } from "./moomoo-request-budget-domain";

export const TRADERLINK_MOOMOO_SHARED_BUDGET_ENV = "TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED";
type QueueEntry = { priority: MoomooPriority; sequence: number; run: () => Promise<void> };
const PRIORITY: Record<MoomooPriority,number> = { connection: 0, scanner: 1, watchlist: 2, other: 3 };
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve,ms));
function retryAfter(response: Response, now: number): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds*1000);
  const date = Date.parse(raw);
  return Number.isFinite(date) ? Math.max(0,date-now) : undefined;
}

export class MoomooSharedTransport {
  private state: MoomooBudgetState | null = null;
  private queue: QueueEntry[] = [];
  private pumping = false;
  private sequence = 0;
  constructor(private readonly input: Readonly<{ ledgerPath: string; now?: () => number; pause?: (milliseconds: number) => Promise<void> }>) {}
  private now(): number { return (this.input.now ?? Date.now)(); }
  private async load(): Promise<void> {
    if (this.state) return;
    let saved: unknown;
    try { saved = JSON.parse(await readFile(this.input.ledgerPath,"utf8")); } catch { saved = null; }
    this.state = restoreBudget(saved,this.now());
    await this.persist();
  }
  private async persist(): Promise<void> {
    if (!this.state) throw Error("moomoo_budget_uninitialized");
    await mkdir(dirname(this.input.ledgerPath),{ recursive: true, mode: 0o700 });
    const temporary = `${this.input.ledgerPath}.${process.pid}.tmp`;
    const handle = await open(temporary,"w",0o600);
    try { await handle.writeFile(JSON.stringify(this.state)); await handle.sync(); } finally { await handle.close(); }
    await rename(temporary,this.input.ledgerPath);
  }
  async reserveScanner(universeCount: number): Promise<void> {
    await this.load(); this.state = reserveScannerDemand(this.state!,universeCount,this.now()); await this.persist();
  }
  async fetch(url: string | URL | Request, init: RequestInit | undefined, priority: MoomooPriority,
    fetcher: typeof fetch = fetch, maximumWaitMs = 60_000): Promise<Response> {
    return new Promise<Response>((resolve,reject) => {
      const started = this.now();
      this.queue.push({ priority, sequence: this.sequence++, run: async () => {
        try {
          await this.load();
          for (;;) {
            const now = this.now();
            if (now-started > maximumWaitMs) throw Error("moomoo_shared_budget_timeout");
            const decision = admitMoomooRequest(this.state!,{ now, priority, scannerQueued: this.queue.some(entry => entry.priority === "scanner") });
            this.state = decision.state;
            if (decision.allowed) break;
            await this.persist(); await (this.input.pause ?? sleep)(Math.max(1,Math.min(decision.retryAt-this.now(),1000)));
          }
          await this.persist();
          const response = await fetcher(url,init);
          const now = this.now();
          this.state = response.status === 429 ? recordMoomoo429(this.state!,now,retryAfter(response,now)) : recordMoomooAccepted(this.state!);
          await this.persist(); resolve(response);
        } catch (error) { reject(error); }
      }});
      void this.pump();
    });
  }
  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (this.queue.length) {
        this.queue.sort((a,b) => PRIORITY[a.priority]-PRIORITY[b.priority] || a.sequence-b.sequence);
        await this.queue.shift()!.run();
      }
    } finally { this.pumping = false; }
  }
}
// Share one request queue across instrumentation, API and page bundles, not one
// queue per compiled copy of this module. Different isolated DBs remain separate.
const processState = globalThis as typeof globalThis & {
  __traderlinkMoomooSharedTransportsV1?: Map<string,MoomooSharedTransport>;
};
const transports = processState.__traderlinkMoomooSharedTransportsV1 ??= new Map();
export function moomooSharedBudgetEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment[TRADERLINK_MOOMOO_SHARED_BUDGET_ENV] === "true";
}
export function getMoomooSharedTransport(environment: NodeJS.ProcessEnv = process.env): MoomooSharedTransport {
  const databasePath = resolvePlatformDatabaseConfig({ environment }).databasePath;
  const ledgerPath = join(dirname(databasePath),"moomoo-shared-budget-v1.json");
  let transport = transports.get(ledgerPath);
  if (!transport) {
    transport = new MoomooSharedTransport({ ledgerPath });
    transports.set(ledgerPath,transport);
  }
  return transport;
}
export async function sharedMoomooFetch(url: string | URL | Request, init: RequestInit | undefined,
  options: Readonly<{ priority: MoomooPriority; fetcher?: typeof fetch; environment?: NodeJS.ProcessEnv; requireEnabled?: boolean }>): Promise<Response> {
  const environment = options.environment ?? process.env;
  if (!moomooSharedBudgetEnabled(environment)) {
    if (options.requireEnabled) throw Error("moomoo_shared_budget_disabled");
    return (options.fetcher ?? fetch)(url,init);
  }
  return getMoomooSharedTransport(environment).fetch(url,init,options.priority,options.fetcher);
}
