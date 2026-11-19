/** Platform-owned control injected into the authenticated Runtime console. */
export const WATCHLIST_PREMIUM_CONTROL = String.raw`<script>
(() => {
 const state = new Map();
 const initialReads = new Map();
 const endpoint = '/api/admin/watchlist/analysis-visibility';
 async function request(symbol, premiumOnly, control) {
  const response = await fetch(endpoint + (premiumOnly === undefined ? '?symbol=' + encodeURIComponent(symbol) + '&control=' + control : ''), {
   method: premiumOnly === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
   headers: { 'Content-Type': 'application/json', 'x-traderlink-journal-admin-request': '1' },
   body: premiumOnly === undefined ? undefined : JSON.stringify({ symbol, premiumOnly, control })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Analysis access is unavailable.');
  if (control === 'all') {
   if (!result.settings || ['ticker','analysis','levels','indicators','row','added'].some(key=>typeof result.settings[key]!=='boolean')) throw new Error('The saved settings could not be checked.');
  } else if (typeof result.premiumOnly !== 'boolean') throw new Error('The saved setting could not be checked.');
  return result;
 }
 function loadInitial(symbol) {
  if (!initialReads.has(symbol)) {
   const read=request(symbol,undefined,'all').catch(error=>{initialReads.delete(symbol);throw error;});
   initialReads.set(symbol,read);
  }
  return initialReads.get(symbol);
 }
 function attach(symbol, container, control) {
  const labelText = control === 'added' ? 'Show Added date for hidden ticker' : control === 'row' ? 'Hide row from members without paid access' : control === 'levels' ? 'Premium-only support & resistance' : 'Premium-only ' + control;
  const key = symbol + ':' + control;
  let item = state.get(key);
  if (!item) { item = { loaded: false, busy: false, value: false, uncertain: false, error: '', loading: false }; state.set(key,item); }
  const label = document.createElement('label'), input = document.createElement('input'), message = document.createElement('small');
  input.type = 'checkbox'; input.setAttribute('role','checkbox'); input.setAttribute('aria-label',symbol + ' ' + labelText);
  label.append(input,document.createTextNode(labelText));
  const option=document.createElement('div');option.className='watchlist-access-option';option.append(label,message);container.append(option);
  message.setAttribute('role','status');
  const show = () => { input.checked=item.uncertain?false:item.value; input.indeterminate=item.uncertain; input.disabled=!item.loaded||item.busy||item.loading; message.textContent=item.error||(!item.loaded?'Loading access…':item.busy?'Saving…':''); };
  const redraw = () => { show(); window.dispatchEvent(new Event('watchlist-review-updated')); };
  input.onchange = async () => {
   const next=input.checked; item.busy=true; item.error=''; show();
   initialReads.delete(symbol);
   try { const result=await request(symbol,next,control); item.value=result.premiumOnly; item.uncertain=false; }
   catch {
    // A failed acknowledgement is not proof that the write failed. Read only;
    // never repeat the mutation or restore an unverified privacy setting.
    try { const saved=await request(symbol,undefined,control); item.value=saved.premiumOnly; item.uncertain=false; item.error=item.value===next?'':'Current setting reloaded. Your change could not be confirmed.'; }
    catch { item.uncertain=true; item.error='The saved setting is unknown. Try again or reload to check it.'; }
   }
   finally { item.busy=false; redraw(); }
  };
  show();
  if((!item.loaded||item.uncertain)&&!item.loading&&!item.busy) {
   item.loading=true; show();
   const read=item.uncertain ? request(symbol,undefined,control).then(result=>result.premiumOnly) : loadInitial(symbol).then(result=>result.settings[control]);
   read.then(value=>{item.value=value;item.loaded=true;item.uncertain=false;item.error='';})
    .catch(()=>{item.error=item.uncertain?'The saved setting is unknown. Try again or reload to check it.':'Access unavailable. Reload to retry.';})
    .finally(()=>{item.loading=false;show();});
  }
 }
 window.watchlistPremiumControl = (symbol,container) => {
  const access=container.closest('.watchlist-grouped-actions')?.querySelector('.watchlist-access-controls') || container;
  attach(symbol,access,'ticker'); attach(symbol,access,'analysis'); attach(symbol,access,'levels'); attach(symbol,access,'indicators'); attach(symbol,access,'row'); attach(symbol,access,'added');
 };
 window.dispatchEvent(new Event('watchlist-review-updated'));
})();
</script>`;
