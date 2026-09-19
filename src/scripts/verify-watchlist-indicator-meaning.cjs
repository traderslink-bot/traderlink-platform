const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const output = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/live-watchlist/indicators/indicator-presentation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: output, Intl, Date });
const rows = (result, timeframe = '1m') => output.indicatorDisplayRows({ result, timeframe, livePrice: 2, vwap: null });
const row = (result, label, timeframe) => rows(result, timeframe).find(r => r.label === label);
assert.equal(row({ ema9: 2, ema20: 1.9, atr14: .1 }, 'Moving averages').tone, 'bullish');
assert.equal(row({ ema9: 1.8, ema20: 1.9, atr14: .1 }, 'Moving averages').tone, 'bearish');
assert.equal(row({ ema9: 1.902, ema20: 1.9, atr14: .1 }, 'Moving averages').tone, 'neutral');
assert.equal(row({ ema9: null, ema20: 1.9 }, 'Moving averages').state, undefined);
for (const [volumeState, state] of [['above_baseline', 'Elevated activity'], ['below_baseline', 'Quiet activity'], ['near_baseline', 'Typical activity']]) {
  const r = row({ volume: 1200, volumeRatio: 1.6, volumeState, volumeBaselineBars: 20 }, 'Volume');
  assert.equal(r.state, state); assert.equal(r.tone, 'activity');
}
assert.equal(row({ volume: null, volumeRatio: 0 }, 'Volume').value, 'Unavailable');
assert.equal(row({ volume: null }, 'Volume').state, undefined);
assert.equal(row({ volume: 0 }, 'Volume').value, '0');
assert.equal(row({ volume: 50, volumeChangePercent: 10 }, 'Volume').state, 'Early comparison');
for (const [volatility, state] of [['expanding', 'Widening swings'], ['contracting', 'Narrowing swings'], ['steady', 'Steady swings']]) {
  const r = row({ atr14: .1, volatility }, 'ATR'); assert.equal(r.state, state); assert.equal(r.tone, 'activity');
}
assert.equal(row({ atr14: null, volatility: 'expanding' }, 'ATR').state, undefined);
assert.equal(row({ atr14: .1 }, 'ATR').state, 'Price swing size');
for (const timeframe of ['1m', '5m', '15m', '1d']) {
  assert.match(row({ atr14: .1 }, 'ATR', timeframe).calculation, new RegExp(timeframe === '1d' ? 'daily' : timeframe));
}
console.log('PASS: 4 timeframes, MA direction/mixed/missing, volume states/missing/zero/early, ATR states/missing/baseline. No providers or AI.');
for (const frame of ['1m', '5m', '15m', '1d']) {
  const base = { dataThrough: Date.parse('2026-09-17T16:00:00Z') };
  for (const [trend, tone] of [['uptrend', 'bullish'], ['downtrend', 'bearish'], ['sideways', 'neutral'], ['mixed', 'neutral']]) {
    const r = row({ ...base, trend }, 'Trend', frame); assert.equal(r.tone, tone); assert.ok(r.state); assert.equal(r.value, '');
  }
  for (const [rsiDirection, tone] of [['rising', 'bullish'], ['falling', 'bearish'], ['recovered_above_oversold', 'bullish'], ['little_changed', 'neutral']]) {
    const r = row({ ...base, rsiDirection }, 'Momentum', frame); assert.equal(r.tone, tone); assert.ok(r.state); assert.equal(r.value, '');
  }
  for (const [rsi14, tone, conditionState] of [[0,'bearish','Oversold'],[29.9,'bearish','Oversold'],[30,'bearish',undefined],[49.9,'bearish',undefined],[50,'neutral',undefined],[50.1,'bullish',undefined],[70,'bullish',undefined],[70.1,'bullish','Overbought'],[100,'bullish','Overbought']]) {
    const r = row({ ...base, rsi14 }, 'RSI', frame); assert.equal(r.tone, tone); assert.equal(r.conditionState, conditionState); assert.equal(r.value, rsi14.toFixed(1));
  }
  for (const label of ['Trend', 'Momentum', 'RSI']) {
    const r = row(base, label, frame); assert.equal(r.state, undefined); assert.equal(r.value, '—'); assert.equal(r.conditionState, undefined);
  }
}
assert.equal(row({rsi14:60}, 'RSI').explanation, 'Upward price movement has the advantage.');
assert.equal(row({rsi14:40}, 'RSI').explanation, 'Downward price movement has the advantage.');
assert.equal(row({rsi14:50}, 'RSI').explanation, 'Neither direction has a clear advantage.');
console.log('PASS: Trend/Momentum tones, RSI direction and separate extreme-condition chips; exact 30/50/70 boundaries and unavailable states across all four timeframes.');
