import { companySymbol } from "@/src/modules/company/server/company-snapshot";
import { openWorkspaceBrokerFeed } from "@/src/modules/market-data/server/workspace-broker-feed-session";
import { readWorkspaceMoomooAccess } from "@/src/modules/market-data/server/workspace-moomoo-access";

import { readBrokerCompanyHistory } from "./history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const access = readWorkspaceMoomooAccess(request);
  if (!access) return new Response(null, { status: 404 });
  const query = new URL(request.url).searchParams;
  const symbol = companySymbol(query.get("symbol") ?? "");
  if (!symbol) return new Response(null, { status: 404 });
  if (!access.connection) return new Response(null, { status: 409, headers: { "Cache-Control": "private, no-store" } });

  if (query.has("range") || query.has("frame")) return readBrokerCompanyHistory(request, symbol, query, access.connection);

  const headers = { "Cache-Control": "private, no-store", "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" };
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const feed = openWorkspaceBrokerFeed(request, access, () => {});
      const interval = setInterval(() => publish(), 5_000);
      let closed = false;
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        request.signal.removeEventListener("abort", stop);
        feed.close();
        if (controller.desiredSize !== null) controller.close();
      };
      const publish = () => {
        try {
          if (request.signal.aborted || !feed.current() || (controller.desiredSize ?? 0) < -4) return stop();
          const session = feed.update([symbol]);
          const { quote, book, activity, relativeVolume } = session ? feed.read(symbol) : {};
          const asOf = Date.now();
          const freshBook = book && asOf - book.observedAt <= 30_000 ? book : undefined;
          if (!feed.current()) return stop();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ session, asOf, quote, book: freshBook, activity, relativeVolume })}\n\n`));
        } catch {
          stop();
        }
      };
      request.signal.addEventListener("abort", stop, { once: true });
      publish();
    },
    cancel: () => stop(),
  });
  return new Response(stream, { headers });
}
