/** Platform-owned control injected into the authenticated Runtime console. */
export const WATCHLIST_PREMIUM_CONTROL = String.raw`<script>
(() => {
 const state = new Map();
 const endpoint = '/api/admin/watchlist/analysis-visibility';
 async function request(symbol, premiumOnly, control) {
  const response = await fetch(endpoint + (premiumOnly === undefined ? '?symbol=' + encodeURIComponent(symbol) + '&control=' + control : ''), {
   method: premiumOnly === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
   headers: { 'Content-Type': 'application/json', 'x-traderlink-journal-admin-request': '1' },
   body: premiumOnly === undefined ? undefined : JSON.stringify({ symbol, premiumOnly, control })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Analysis access is unavailable.');
  return result;
 }
 function attach(symbol, container, control) {
  const key = symbol + ':' + control;
  let item = state.get(key);
  if (!item) { item = { loaded: false, busy: false, value: false, error: '', loading: false }; state.set(key,item); }
  const label = document.createElement('label'), input = document.createElement('input'), message = document.createElement('small');
  input.type = 'checkbox'; input.setAttribute('role','switch'); input.setAttribute('aria-label',symbol + ' Premium-only ' + control);
  label.append(input,document.createTextNode('Premium-only ' + control));
  const option=document.createElement('div');option.className='watchlist-access-option';option.append(label,message);container.append(option);
  message.setAttribute('role','status');
  const show = () => { input.checked=item.value; input.disabled=!item.loaded||item.busy; message.textContent=item.error||(!item.loaded?'Loading access…':item.busy?'Saving…':''); };
  const redraw = () => { show(); window.dispatchEvent(new Event('watchlist-review-updated')); };
  input.onchange = async () => {
   const next=input.checked; item.busy=true; item.error=''; show();
   try { const result=await request(symbol,next,control); item.value=result.premiumOnly; }
   catch(error) { item.error=error.message||'Analysis access was not saved.'; }
   finally { item.busy=false; redraw(); }
  };
  show();
  if(!item.loaded&&!item.loading) {
   item.loading=true;
   request(symbol,undefined,control).then(result=>{item.value=result.premiumOnly;item.loaded=true;item.error='';})
    .catch(()=>{item.error='Access unavailable. Reload to retry.';})
    .finally(()=>{item.loading=false;show();});
  }
 }
 window.watchlistPremiumControl = (symbol,container) => {
  const access=container.closest('.watchlist-grouped-actions')?.querySelector('.watchlist-access-controls') || container;
  attach(symbol,access,'ticker'); attach(symbol,access,'analysis');
 };
 window.dispatchEvent(new Event('watchlist-review-updated'));
})();
</script>`;
