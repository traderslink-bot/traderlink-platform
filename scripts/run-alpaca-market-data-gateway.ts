import { homedir } from "node:os";
import { createAlpacaGateway, readPrivateJson } from "../src/modules/scanner/alpaca/gateway";

async function main() {
  const credentials = await readPrivateJson(`${homedir()}/.config/traderlink/alpaca-owner-test.json`);
  const configuration = await readPrivateJson(`${homedir()}/.config/traderlink/alpaca-gateway.json`);
  if (!credentials.keyId || !credentials.secretKey || !configuration.token || configuration.token.length < 32) throw Error("Private configuration incomplete");
  const gateway = createAlpacaGateway({ keyId: credentials.keyId, secretKey: credentials.secretKey, token: configuration.token });
  gateway.server.listen(3041, "127.0.0.1", () => console.log("Alpaca owner-test gateway listening on loopback 3041"));
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => { gateway.close(); setTimeout(() => process.exit(), 1000).unref(); });
}
main().catch(() => { console.error("Alpaca gateway could not start. Check private configuration and file permissions."); process.exitCode = 1; });
