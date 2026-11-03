# Scanner early momentum detection — 2026-11-03

The Momentum scanner now supports five independent qualification paths over the
same timestamped Moomoo snapshot stream: immediate volume ignition, building
volume, sub-minute price burst, combined developing activity, and the existing
rolling one- or five-minute price movement. No candle endpoint or additional
market-data request is introduced.

Each observation uses the actual elapsed seconds since the preceding accepted
snapshot. Cumulative provider volume and dollar-volume counters are differenced
to obtain interval activity. The recent median interval rate supplies a robust
per-ticker baseline. When the current rate or absolute activity becomes
meaningful, an episode starts at the preceding observation boundary and retains
shares, dollar volume, elapsed time and price change until activity is quiet
for the configured expiry. This is a first-detected interval, not an invented
trade-by-trade start time.

Default early-detection controls are deliberately editable by session in
Screeners Admin:

- immediate volume rate: 5x baseline;
- building volume rate: 2x baseline with two confirming observations;
- premarket/after-hours episode reference: 10,000 shares, $10,000 and 0.05%
  float turnover;
- regular-hours episode reference: 25,000 shares, $25,000 and 0.05% float
  turnover;
- price burst: 1.5% within at most 30 actual seconds;
- quiet episode expiry: three quiet observations or 90 seconds.

An episode must satisfy at least two of its share, dollar-volume and float-
turnover references; this avoids treating the same share count as equivalent
for a $0.15 stock and a $3 stock. An absolute-intensity path handles a zero or
unavailable baseline. Episode state resets at every session boundary and closes
when activity returns toward baseline. All existing
price, market-cap, float, total-volume, dollar-volume and spread filters still
apply. Momentum ranking now considers the strongest sub-minute/one-minute/
five-minute price evidence, interval or rolling volume acceleration, episode or
one-minute dollar volume, RVOL and spread. Expanded rows identify the detection
paths and show episode volume, episode dollar volume and elapsed time. Audit
decisions retain the exact paths and raw episode measurements.

When all live momentum signals disappear, a previously detected ticker enters
a 30-second cooling period. A renewed signal immediately returns it to active
state and restarts any later cooling interval. Without renewed activity, it is
removed exactly at the cooling deadline. Stocks that never qualified are not
retained, normal scanner filters continue to apply, and session changes clear
cooling state. Active rows rank ahead of cooling rows so a cooling ticker does
not displace a currently active detection. Audit decisions preserve the active/cooling state, last active
time and removal deadline after the visible row is gone.

The Help Center currently has no live-screeners guide to update. A guide should
be created only after the owner accepts the live behavior and terminology.
Focused source/UI checks are recorded with the implementation commit; hosted
behavior and threshold calibration remain separate live-market checkpoints.

## PARA production-audit calibration

The pre-release review used 1,674 saved production observations for PARA from
5:07:30 through 9:49:05 AM Eastern on 2026-11-03. No production data was
changed. From 5–8 AM, the median roughly ten-second interval was 177 shares and
$362; its 99th percentile was 4,451 shares and $9,410. The meaningful build
started around 8:54:47 with 5,922 shares/$11.2K, followed by 7,926/$15.3K and
continued additions. By 8:55:07 the episode held approximately 14.5K shares and
$27.7K while price moved from $1.88 to $2.00. This supports accumulated episode
intensity rather than a fixed 30K-share gate.

The regular-session ledger resets independently. Its first measured burst at
9:30:18 added about 647K shares and $3.01M in 12.2 seconds; another interval at
9:31:07 added 629K shares and $3.32M while price rose 7.88%. The prior local
prototype would have carried episode totals too long and across session
boundaries. The corrected design closes after quiet observations and always
resets between premarket, regular hours and after-hours.
