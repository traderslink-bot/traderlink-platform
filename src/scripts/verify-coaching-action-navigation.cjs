// Isolated action navigation checks: no hosted database or Next server required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'app/(dashboard)/communities/community-actions.ts'), 'utf8');
const events = [];
let deny = false;
class Repository {
  sendCoachingMessage(input) {
    if (deny) throw new Error('Access denied');
    events.push(['message', input.relationshipId, input.body]);
  }
}
const exportsObject = {};
const compiled = ts.transpileModule(source + '\nexport const qaNavigation = { updatedCommunityUrl, revalidateCommunityPath };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(compiled, {
  exports: exportsObject, FormData, Date,
  require(id) {
    if (id === 'next/cache') return { refresh: () => events.push(['refresh']), revalidatePath: value => events.push(['revalidate', value]) };
    if (id === 'next/navigation') return { redirect: value => { throw new Error(`Unexpected redirect: ${value}`); } };
    if (id.endsWith('/require-platform-request-scope')) return { requireTraderLinkPlatformPageIdentity: async () => ({ scope: { userId: 'qa-coach' } }) };
    if (id.endsWith('/open-platform-database')) return { withPlatformDatabase: (_options, callback) => callback({ prepare: () => ({ get: () => ({ community_id: 'qa-community' }) }) }) };
    if (id.endsWith('/platform-migration-contract')) return { createCanonicalUtcTimestamp: () => '2026-09-28T00:00:00.000Z' };
    if (id.endsWith('/traderlink-community-viewer')) return { resolveTraderLinkCommunityViewer: () => ({ userId: 'qa-coach' }) };
    if (id.endsWith('/traderlink-community-platform-repository')) return { TraderLinkCommunityPlatformRepository: Repository };
    return {};
  },
});
(async () => {
  const { updatedCommunityUrl, revalidateCommunityPath } = exportsObject.qaNavigation;
  assert.match(updatedCommunityUrl('test-community', 'coaching'), /^\/communities\/coaching\?updated=/);
  assert.match(updatedCommunityUrl('test-community', 'workspace/students/qa'), /^\/communities\/test-community\/workspace\/students\/qa\?updated=/);
  revalidateCommunityPath('test-community', 'coaching');
  assert(events.some(event => event[0] === 'revalidate' && event[1] === '/communities/coaching'));
  assert(!events.some(event => event[1] === '/communities/test-community/coaching'));
  events.length = 0;
  const form = new FormData();
  form.set('communitySlug', 'test-community'); form.set('relationshipId', 'qa-student'); form.set('body', 'Synthetic test');
  await exportsObject.sendCommunityCoachingMessageAction(form);
  assert.deepEqual(events, [
    ['message', 'qa-student', 'Synthetic test'],
    ['revalidate', '/communities/coaching'],
    ['revalidate', '/communities/test-community'],
    ['revalidate', '/communities/test-community/workspace/students/qa-student'],
    ['refresh'],
  ]);
  events.length = 0; deny = true;
  await assert.rejects(exportsObject.sendCommunityCoachingMessageAction(form), /Access denied/);
  assert.equal(events.length, 0);
  console.log('PASS: canonical student navigation, preserved coach page, both views invalidated, authorization failure unchanged');
})().catch(error => { console.error(error); process.exitCode = 1; });
