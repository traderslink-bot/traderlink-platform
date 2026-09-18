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
