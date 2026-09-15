import assert from 'node:assert/strict';
import { indicatorDisplayRows } from '../lib/live-watchlist/indicators/indicator-presentation.ts';
import { calculateSessionVwap } from '../lib/live-watchlist/indicators/indicator-engine.ts';
const rows = indicatorDisplayRows({ timeframe: '1m', livePrice: 2, vwap: null,
  result: { volume: null, volumeRatio: 0, volumeChangePercent: -100, ema9: 1.9, ema20: 1.8, rsi14: 60 } });
assert.equal(rows.find(r => r.label === 'Volume').value, 'Unavailable');
assert.equal(rows.find(r => r.label === 'Volume').explanation, '');
assert.equal(rows.find(r => r.label === 'VWAP').value, 'Unavailable');
assert.match(rows.find(r => r.label === 'Moving averages').value, /1.90/);
assert.match(rows.find(r => r.label === 'RSI').value, /60/);
const start = Date.parse('2026-09-15T20:00:00Z');
assert.equal(calculateSessionVwap({ candles: [{ start, end: start + 60000, open: 2,
  high: 2.1, low: 1.9, close: 2, volume: null, sessionKey: '2026-09-15:post' }],
  sessionStart: start, sessionEnd: start + 60000, completedThrough: start + 60000, coverageComplete: true }).value, null);
const zero = indicatorDisplayRows({ timeframe: '1m', livePrice: 2, vwap: 2, result: { volume: 0 } });
assert.equal(zero.find(r => r.label === 'Volume').value, '0');
console.log('PASS: 7 unavailable-volume/VWAP and retained price-indicator assertions. No network requests.');
