// Joint Scanner / Personal Alerts test fixture. The caller supplies an isolated directory and Company gateway.
import { join } from "node:path";
import { CustomScanMarket } from "../modules/scanner/custom/market";
import { SharedScanEnrichment } from "../modules/scanner/custom/shared-scan-enrichment";
import { EMPTY_SCAN, type SavedScan } from "../modules/scanner/custom/definition";
import { readSavedCustomScans, writeSavedCustomScans } from "../modules/scanner/custom/saved";
import { readScannerCompanyBatch } from "../modules/scanner/custom/server/company-filter-data";
import {
  createMasterScannerMatches,
  type MasterScanRecipient,
} from "../modules/scanner/custom/server/master-scan-matches";
import {
  recheckMasterMatchFacts,
  savedMasterFacts,
} from "../modules/scanner/custom/server/master-scan-match-evaluation";
import type { ScannerReadModel } from "../modules/scanner/live/contracts";

export async function replayClroSavedScans(directory: string, recipient: MasterScanRecipient) {
  const savedDirectory = join(directory, "saved");
  const specs: SavedScan[] = [
    {
      id: "d4d47433-dbee-4fda-956e-f711cfae49e8",
      name: "Annual revenue at least $40M",
      definition: { ...EMPTY_SCAN, rules: [{ metric: "annualRevenue", minimum: 40_000_000, maximum: null }] },
    },
    {
      id: "d4d47433-dbee-4fda-956e-f711cfae49e9",
      name: "Annual revenue exactly zero",
      definition: { ...EMPTY_SCAN, rules: [{ metric: "annualRevenue", minimum: 0, maximum: 0 }] },
    },
  ];
  writeSavedCustomScans(savedDirectory, recipient.userId, { revision: 0, scans: specs });
  const reopened = readSavedCustomScans(savedDirectory, recipient.userId).scans;
  const enrichment = new SharedScanEnrichment({ company: readScannerCompanyBatch });
  const market = new CustomScanMarket(enrichment);
  const detach = market.attachQueries(
    reopened.map((s) => ({ key: s.id, page: 1, definition: s.definition })),
  );
  // First open exchange session after publication of the November 26 replay fixture.
  let now = Date.parse("2026-11-27T15:00:00Z");
  const empty = { rows: [], total: 0, focus: [] };
  let model: ScannerReadModel;
  function publish(withClro: boolean) {
    const rows = withClro
      ? [
          {
            symbol: "CLRO",
            exchange: "NASDAQ" as const,
            price: 1,
            volume: 100,
            dollarVolume: 100,
            marketCap: 2_000_000,
            float: 200_000,
            dayChange: 0,
            belowHigh: 0,
            observedAt: now,
          },
        ]
      : [];
    model = {
      status: "ready",
      session: "regular",
      tradingDate: "2026-11-27",
      updatedAtUtc: new Date(now).toISOString(),
      universeCount: rows.length,
      receivedCount: rows.length,
      missingSymbols: [],
      missingFloatCount: 0,
      issues: [],
      gainers: empty,
      momentum: empty,
    };
    market.set("open", now, "fixture", rows, new Set(rows.map((r) => r.symbol)));
  }
  const producer = createMasterScannerMatches({
    directory: join(directory, "ledger"),
    savedDirectory,
    now: () => now,
    presetRevision: () => 1,
    readIdentity: (actor) =>
      actor.userId === recipient.userId && actor.workspaceId === recipient.workspaceId
        ? {
            scope: { ...actor, workspaceRole: "member", allowedAccountIds: [], activeAccountId: null },
            displayName: null,
            sessionId: null,
            mode: "platform_session",
            discord: null,
          }
        : null,
    allowScanner: () => true,
    allowNews: () => false,
    cachedEvidence: recheckMasterMatchFacts,
    verifyEvidence: (identity, fact) => recheckMasterMatchFacts(identity, fact, true),
    open: (source) => ({
      close() {},
      sample: async () =>
        source.kind === "saved" ? savedMasterFacts(source.definition, market, model, now) : null,
    }),
  });
  const sources = specs.map(
    (s) => producer.resolveMasterScanSource(recipient, { kind: "saved", id: s.id })!.source,
  );
  try {
    publish(false);
    for (const source of sources) await producer.captureMasterScanMatches(recipient, source);
    now += 30_000;
    const ready = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(Error("Company snapshot did not arrive"));
      }, 12_000);
      const unsubscribe = market.subscribe(() => {
        if (!enrichment.companyReadings("CLRO", now)) return;
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      });
    });
    publish(true);
    await ready;
    const results = reopened.map((s) => market.query({ key: s.id, definition: s.definition, page: 1 }));
    for (const source of sources) await producer.captureMasterScanMatches(recipient, source);
    return { producer, sources, results, reading: enrichment.companyReadings("CLRO", now), now };
  } finally {
    detach?.();
  }
}
