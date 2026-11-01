export const WATCHLIST_CONSOLE_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts";

/** Runs before upstream scripts; the opaque frame never receives app credentials. */
export const WATCHLIST_CONSOLE_BOOTSTRAP = String.raw`<script>
(() => {
 if (window.parent === window) return;
 const origin = window.location.origin;
 const pending = new Map();
 let sequence = 0;
 const generation = crypto.randomUUID();
 window.parent.postMessage({source:"traderslink-watchlist-relay",type:"initialize",generation},origin);
 window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.href);
  const method = String(options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const body = options.body !== undefined ? options.body : input instanceof Request && method !== 'GET' ? await input.text() : undefined;
  if (body !== undefined && typeof body !== 'string') throw new Error('Unsupported console request');
  const id = generation + '-' + (++sequence);
  const signal = options.signal || (input instanceof Request ? input.signal : undefined);
  return new Promise((resolve, reject) => {
   const abort = () => { const item=pending.get(id);item?.finish();pending.delete(id); window.parent.postMessage({source:'traderslink-watchlist-relay',type:'cancel',id},origin); reject(new DOMException('Cancelled','AbortError')); };
   if (signal?.aborted) { abort(); return; }
   const timer = setTimeout(abort, 180000);
   pending.set(id, {resolve,reject,finish:()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);}});
   signal?.addEventListener('abort',abort,{once:true});
   window.parent.postMessage({source:'traderslink-watchlist-relay',type:'request',id,url:url.href,method,body},origin);
  });
 };
 window.addEventListener('message', event => {
  if(event.source!==window.parent || event.origin!==origin || event.data?.source!=='traderslink-watchlist-relay-response')return;
  const item=pending.get(event.data.id);if(!item)return;pending.delete(event.data.id);item.finish();
  if(event.data.error){item.reject(new Error(event.data.error));return;}
  item.resolve(new Response(event.data.body,{status:event.data.status,headers:{'content-type':event.data.contentType}}));
 });
 const resize=()=>window.parent.postMessage({source:'traderslink-watchlist-admin',type:'frame-height',height:Math.min(20000,Math.max(900,document.documentElement?.scrollHeight||900))},origin);
 const observe=()=>{new ResizeObserver(resize).observe(document.documentElement);resize();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
</script>`;
