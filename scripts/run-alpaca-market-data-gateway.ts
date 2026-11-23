import { marketHaltSource } from "../src/modules/scanner/alpaca/halt-source";
import { isAbsolute } from "node:path";
import { homedir } from "node:os";
import { createAlpacaGateway, readPrivateJson } from "../src/modules/scanner/alpaca/gateway";
import { createAlpacaVerifiedLevelsProvider } from "../src/modules/scanner/alpaca/verified-levels-provider";

async function main() {
  const credentials = await readPrivateJson(`${homedir()}/.config/traderlink/alpaca-owner-test.json`);
  const configuration = await readPrivateJson(`${homedir()}/.config/traderlink/alpaca-gateway.json`);
  if (!credentials.keyId || !credentials.secretKey || !configuration.token || configuration.token.length < 32) throw Error("Private configuration incomplete");
  const scannerLevels = configuration.verifiedScannerLevels === "1"
    ? createAlpacaVerifiedLevelsProvider({ keyId: credentials.keyId, secretKey: credentials.secretKey })
    : undefined;
  const archivePath = configuration.candleHistoryPath;
  const archiveToken = configuration.candleHistoryAdminToken;
  const archiveReadPath = configuration.candleHistoryReadPath;
  if (archiveReadPath !== undefined && (!isAbsolute(archiveReadPath) || archivePath !== undefined || archiveToken !== undefined)) {
    throw Error("Invalid read-only candle history configuration");
  }
  if ((archivePath || archiveToken) && (!archivePath || !isAbsolute(archivePath) ||
    !archiveToken || archiveToken.length < 32 || archiveToken === configuration.token)) {
    throw Error("Invalid candle history configuration");
  }
  const gateway = createAlpacaGateway({
    keyId: credentials.keyId, secretKey: credentials.secretKey, token: configuration.token,
    overnightCharts: configuration.overnightCharts === "1", haltSource: marketHaltSource(),
    haltStatusJournal: `${homedir()}/.config/traderlink/alpaca-halt-status.jsonl`,
    ...(archivePath && archiveToken ? { candleHistory: { path: archivePath, adminToken: archiveToken } } : {}),
    candleHistoryReadPath: archiveReadPath,
    readVerifiedLevelsHistory: scannerLevels?.readHistory, observeScannerLevelsInterval: scannerLevels?.observeInterval,
  });
  gateway.server.listen(3041, "127.0.0.1", () => console.log("Alpaca owner-test gateway listening on loopback 3041"));
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => { gateway.close(); setTimeout(() => process.exit(), 1000).unref(); });
}
main().catch(() => { console.error("Alpaca gateway could not start. Check private configuration and file permissions."); process.exitCode = 1; });
