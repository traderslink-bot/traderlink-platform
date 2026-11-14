import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { readGainerArchive } from "@/src/modules/stock-gainers/server/archive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const canonical = "https://traderslink.pro/stock-gainers/";
const routes = /^(?:\d{4}-\d{2}-\d{2}|month\/\d{4}-\d{2}|sitemap\.xml)?$/;
let cached: { archive: NonNullable<Awaited<ReturnType<typeof readGainerArchive>>>; pages: Map<string, Promise<string>> } | undefined;
let version = "";

function render(path: string, archive: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [join(process.cwd(), "src/scripts/render-public-gainers-request.py"), path], {
      timeout: 10_000,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let html = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { html += chunk; });
    child.stdin.on("error", reject);
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(html) : reject(new Error("Gainers renderer failed")));
    child.stdin.end(JSON.stringify(archive));
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const path = (await params).path?.join("/") ?? "";
  if (!routes.test(path)) return new Response("Not found", { status: 404 });
  try {
    const file = process.env.TRADERLINK_DAILY_GAINERS_ARCHIVE_PATH;
    const metadata = file ? await stat(file) : undefined;
    const current = metadata ? `${metadata.ino}:${metadata.mtimeMs}:${metadata.size}` : "";
    if (!cached || !current || version !== current) {
      const archive = await readGainerArchive();
      if (!archive || !Object.keys(archive.sessions).length) throw new Error("Archive unavailable");
      cached = { archive, pages: new Map() };
      version = current;
    }
    const { archive, pages } = cached;
    if (path.startsWith("month/") ? !Object.keys(archive.sessions).some(day => day.startsWith(path.slice(6) + "-")) :
        path && path !== "sitemap.xml" && !Object.hasOwn(archive.sessions, path)) {
      return new Response("Not found", { status: 404 });
    }
    let response = pages.get(path);
    if (!response) {
      if (pages.size >= 64) pages.clear();
      response = render(path, archive).catch(error => { pages.delete(path); throw error; });
      pages.set(path, response);
    }
    return new Response(await response, { headers: {
      "Content-Type": path === "sitemap.xml" ? "application/xml; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      Link: `<${canonical}${path === "sitemap.xml" ? path : path ? path + "/" : ""}>; rel="canonical"`,
    } });
  } catch {
    return new Response("Stock gainers temporarily unavailable", { status: 503, headers: { "Retry-After": "60" } });
  }
}
