export const WATCHLIST_GAIN_START_CONTROL = String.raw`<script>
window.watchlistGainStart = (symbol, more) => {
  if (!more || more.querySelector('[data-gain-start]')) return;
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = 'Edit Gain Card'; button.dataset.gainStart = 'true';
  button.addEventListener('click', () => window.parent.postMessage({source:'traderslink-watchlist-admin',type:'gain-starting-point',symbol},window.location.origin));
  more.append(button);
};
</script>`;
