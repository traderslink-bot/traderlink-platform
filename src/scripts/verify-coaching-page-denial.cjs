const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/community-dashboard-loader.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
async function check(failure, expectedNotFound) {
  const output = {};
  const missing = new Error('next-not-found');
  let snapshotReads = 0;
  vm.runInNewContext(compiled, { exports: output, process, require(id) {
    if (id === 'next/navigation') return { notFound() { throw missing; } };
    if (id.endsWith('/platform-migration-contract')) return { isTraderLinkPlatformError: e => e?.platform === true };
    if (id.endsWith('/require-platform-request-scope')) return { requireTraderLinkPlatformServerComponentPageIdentity: async () => ({ scope: { userId: 'unrelated-member' } }) };
    if (id.endsWith('/community-request-access')) return { requireCommunityRequestAccess: async () => {} };
    if (id.endsWith('/open-platform-database')) return { withPlatformDatabase: (_, fn) => fn({}) };
    if (id.endsWith('/traderlink-community-viewer')) return { resolveTraderLinkCommunityViewer: () => ({ userId: 'unrelated-member' }) };
    if (id.endsWith('/traderlink-community-platform-repository')) return { TraderLinkCommunityPlatformRepository: class { readSnapshot() { snapshotReads++; throw failure; } } };
    return {};
  } });
  await assert.rejects(output.loadCommunityDashboard('test-community', '/communities/test-community/workspace/students/private-relationship'), e => e === (expectedNotFound ? missing : failure));
  assert.equal(snapshotReads, 1);
}
(async () => {
  await check({ platform: true, code: 'TRADERLINK_WORKSPACE_ACCESS_DENIED' }, true);
  await check({ platform: true, code: 'TRADERLINK_WORKSPACE_NOT_FOUND' }, true);
  await check({ platform: true, code: 'TRADERLINK_DATABASE_UNAVAILABLE' }, false);
  await check(new Error('unexpected failure'), false);
  console.log('PASS: denied/missing community pages use not-found; infrastructure and unexpected errors remain errors');
})().catch(error => { console.error(error); process.exitCode = 1; });
