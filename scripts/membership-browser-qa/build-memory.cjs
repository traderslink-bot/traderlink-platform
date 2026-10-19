// Local QA resource settings only; never changes the application configuration.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
assert.equal(process.env.MEMBERSHIP_QA_BUILD_MEMORY, '1');
// Type checking needs more heap than webpack; don't inflate compiler peaks.
const workerTarget = require.resolve('next/dist/lib/worker');
const workers = require(workerTarget);
require.cache[workerTarget].exports = { ...workers, Worker: class extends workers.Worker {
  constructor(workerPath, options) {
    const typecheck = workerPath.endsWith('/verify-typescript-setup.js');
    super(workerPath, typecheck ? { ...options, forkOptions: { ...options.forkOptions,
      execArgv: [...(options.forkOptions?.execArgv || []), '--max-old-space-size=4096'],
    } } : options);
  }
} };
const target = require.resolve('next/dist/server/config');
const original = require(target);
const settings = { webpackMemoryOptimizations: true, webpackBuildWorker: true, cpus: 2 };
require.cache[target].exports = { ...original, __esModule: true, default: async (...args) => {
  const config = await original.default(...args);
  config.experimental = { ...config.experimental, ...settings };
  fs.writeFileSync(path.join(process.env.MEMBERSHIP_QA_EVIDENCE, 'build-memory.json'), JSON.stringify(settings, null, 2));
  return config;
} };
