/** Platform-owned control injected into the authenticated Runtime console. */
export const WATCHLIST_PREMIUM_CONTROL = String.raw`<script>
(() => {
 const state = new Map();
 const endpoint = '/api/admin/watchlist/analysis-visibility';
 async function request(symbol, premiumOnly) {
  const response = await fetch(endpoint + (premiumOnly === undefined ? '?symbol=' + encodeURIComponent(symbol) : ''), {
   method: premiumOnly === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
   headers: { 'Content-Type': 'application/json', 'x-traderlink-journal-admin-request': '1' },
   body: premiumOnly === undefined ? undefined : JSON.stringify({ symbol, premiumOnly })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Analysis access is unavailable.');
  return result;
 }
 window.watchlistPremiumControl = (symbol, container) => {
  let item = state.get(symbol);
  if (!item) { item = { loaded: false, busy: false, value: false, error: '', loading: false }; state.set(symbol,item); }
  const label = document.createElement('label'), input = document.createElement('input'), message = document.createElement('small');
  input.type = 'checkbox'; input.setAttribute('role','switch'); input.setAttribute('aria-label',symbol + ' Premium-only analysis');
  label.append(input,document.createTextNode('Premium-only analysis')); container.append(label,message);
  message.setAttribute('role','status');
  const show = () => { input.checked=item.value; input.disabled=!item.loaded||item.busy; message.textContent=item.error||(!item.loaded?'Loading access…':item.busy?'Saving…':''); };
  const redraw = () => { show(); window.dispatchEvent(new Event('watchlist-review-updated')); };
  input.onchange = async () => {
   const next=input.checked; item.busy=true; item.error=''; show();
   try { const result=await request(symbol,next); item.value=result.premiumOnly; }
   catch(error) { item.error=error.message||'Analysis access was not saved.'; }
   finally { item.busy=false; redraw(); }
  };
  show();
  if(!item.loaded&&!item.loading) {
   item.loading=true;
   request(symbol).then(result=>{item.value=result.premiumOnly;item.loaded=true;item.error='';})
    .catch(()=>{item.error='Access unavailable. Reload to retry.';})
    .finally(()=>{item.loading=false;show();});
  }
 };
 window.dispatchEvent(new Event('watchlist-review-updated'));
})();
</script>`;
