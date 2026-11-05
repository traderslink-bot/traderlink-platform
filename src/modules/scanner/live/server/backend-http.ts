import "server-only";
import type { ScannerConfiguration, ScannerReadModel } from "../contracts";

const RESPONSE_HEADERS = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };
const json = (value: unknown,status=200) => Response.json(value,{ status,headers: RESPONSE_HEADERS });
export type LiveScannerHttpDependencies = Readonly<{
  member: (request: Request) => boolean;
  read: () => ScannerReadModel | Promise<ScannerReadModel>;
}>;
export type ScannerSettingsHttpDependencies = Readonly<{
  owner: (request: Request) => boolean;
  mutation: (request: Request) => boolean;
  configuration: () => Promise<ScannerConfiguration>;
  save: (configuration: unknown, expectedRevision: number) => Promise<ScannerConfiguration>;
}>;
export type ScannerFloatsHttpDependencies = Readonly<{
  owner: (request: Request) => boolean;
  read: (symbols: readonly string[]) => Promise<Readonly<{
    tradingDate: string;
    exchanges: Readonly<Record<string,"NASDAQ"|"NYSE">>;
    floats: Readonly<Record<string,Readonly<{ shares:number; retrievedAtUtc:string }>>>;
  }>>;
}>;
const SYMBOL=/^[A-Z][A-Z0-9.-]{0,15}$/u;
async function body(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/u.test(length) || Number(length) > 32_768)) throw Error("scanner_settings_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw Error("scanner_settings_invalid");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 32_768) { await reader.cancel(); throw Error("scanner_settings_too_large"); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(new TextDecoder("utf-8",{ fatal: true }).decode(Buffer.concat(chunks)));
}
export async function handleLiveScannerGet(request: Request, dependencies: LiveScannerHttpDependencies): Promise<Response> {
  if (request.method !== "GET" || !dependencies.member(request)) return json({ code: "not_found" },404);
  try { return json(await dependencies.read()); }
  catch { return json({ code: "scanner_unavailable" },503); }
}
export async function handleScannerFloatsGet(request:Request,dependencies:ScannerFloatsHttpDependencies):Promise<Response>{
  if(request.method!=="GET"||!dependencies.owner(request))return json({ code:"not_found" },404);
  const raw=new URL(request.url).searchParams.get("symbols");
  if(!raw)return json({ code:"scanner_float_request_invalid" },400);
  const symbols=Object.freeze([...new Set(raw.split(","))]);
  if(symbols.length>60||symbols.some(symbol=>!SYMBOL.test(symbol)))return json({ code:"scanner_float_request_invalid" },400);
  try{return json(await dependencies.read(symbols));}
  catch{return json({ code:"scanner_floats_unavailable" },503);}
}
export async function handleScannerSettings(request: Request, dependencies: ScannerSettingsHttpDependencies): Promise<Response> {
  if (request.method === "GET") {
    if (!dependencies.owner(request)) return json({ code: "not_found" },404);
    try { return json({ configuration: await dependencies.configuration() }); }
    catch { return json({ code: "scanner_settings_unavailable" },503); }
  }
  if (request.method !== "POST" || !dependencies.mutation(request) || !dependencies.owner(request)) return json({ code: "not_found" },404);
  try {
    const value = await body(request);
    if (!value || typeof value !== "object" || Array.isArray(value)) return json({ code: "scanner_settings_invalid" },400);
    const record = value as Record<string,unknown>;
    if (!Number.isSafeInteger(record.expectedRevision) || Number(record.expectedRevision) < 0 || !Object.hasOwn(record,"configuration"))
      return json({ code: "scanner_settings_invalid" },400);
    return json({ configuration: await dependencies.save(record.configuration,Number(record.expectedRevision)) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return code === "scanner_settings_conflict" ? json({ code },409)
      : code === "scanner_settings_too_large" ? json({ code },413)
      : /^scanner_settings_/u.test(code) || error instanceof SyntaxError ? json({ code: "scanner_settings_invalid" },400)
      : json({ code: "scanner_settings_unavailable" },503);
  }
}
