// QA-only development preview configuration; never loaded by the application launcher.
const assert = require('node:assert/strict');
assert.equal(process.env.MEMBERSHIP_QA_REVIEW_DEV, '1');
assert.equal(process.env.NODE_ENV, 'development');
const target = require.resolve('next/dist/server/config');
const original = require(target);
require.cache[target].exports = {...original, __esModule:true, default:async (...args)=>{
  const config = await original.default(...args);
  const hostname = new URL(process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN).hostname;
  config.allowedDevOrigins = [...(config.allowedDevOrigins || []),hostname];
  config.experimental = {...config.experimental,cpus:2,webpackMemoryOptimizations:true};
  return config;
}};
