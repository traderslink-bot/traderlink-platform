const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/coaching/page.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
async function check(capabilities, enrolled, expected, communities = [{ communityId: 'test', slug: 'test-community' }]) {
  const output = {};
  let destination;
  vm.runInNewContext(compiled, { exports: output, require(id) {
    if (id === 'next/navigation') return { redirect: value => { destination = value; } };
    if (id.endsWith('/require-platform-request-scope')) return { requireTraderLinkPlatformServerComponentPageIdentity: async () => ({ scope: { userId: 'student' } }) };
    if (id.endsWith('/traderlink-community-repository')) return { TraderLinkCommunityRepository: class {
      listForUser() { return communities; }
      resolveAccess() { return { capabilities }; }
    } };
    if (id.endsWith('/open-readonly-platform-database')) return { withReadonlyPlatformDatabase: (_, callback) => callback({ prepare: () => ({ get: (community, user) => {
      assert.equal(community, 'test'); assert.equal(user, 'student');
      return enrolled ? { found: 1 } : undefined;
    } }) }) };
    throw new Error(`Unexpected import: ${id}`);
  } });
  await output.default();
  assert.equal(destination, expected);
}
(async () => {
  await check(['community.coaching.offer'], false, '/communities/test-community/workspace');
  await check(['community.coaching.students'], false, '/communities/test-community/workspace');
  await check(['community.coaching.view'], false, '/communities/test-community/coaches');
  await check(['community.coaching.manage_all'], false, '/communities/test-community/coaches');
  await check([], true, '/communities/test-community/coaching');
  await check(['community.coaching.offer'], true, '/communities/test-community/coaching');
  await check([], false, '/communities');
  await check([], false, '/communities', []);
  console.log('PASS: eight coaching entry-point cases; student ownership and destination permissions preserved');
})().catch(error => { console.error(error); process.exitCode = 1; });
