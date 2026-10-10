const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/api/communities/[communitySlug]/coaching/attachments/[attachmentId]/route.ts'), 'utf8');
const output = {};
let failure, failureAt, databaseReads = 0, missingCommunity = false, filename = 'chart.png';
const denied = code => Object.assign(new Error(code), {code, platform: true});
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {
  exports: output, Response, Uint8Array,
  require(id) {
    if (id.endsWith('/require-platform-request-scope')) return {requireTraderLinkPlatformRequestIdentity() {if(failureAt === 'identity') throw failure; return {};}};
    if (id.endsWith('/open-readonly-platform-database')) return {withReadonlyPlatformDatabase(_options, read) {databaseReads++; return read({prepare: () => ({get: () => missingCommunity ? undefined : {community_id: 'community'}})});}};
    if (id.endsWith('/traderlink-community-viewer')) return {resolveTraderLinkCommunityViewer() {if(failureAt === 'viewer') throw failure; return {userId: 'student'};}};
    if (id.endsWith('/traderlink-community-coaching-program-service')) return {TraderLinkCommunityCoachingProgramService: class {readImage() {if(failureAt === 'image') throw failure; return {content: Buffer.from([1,2,3]), mediaType: 'image/png', filename};}}};
    if (id.endsWith('/platform-migration-contract')) return {isTraderLinkPlatformError: error => error?.platform === true};
    throw new Error(`Unexpected import ${id}`);
  },
});
const request = new Request('https://example.test/image');
const context = {params: Promise.resolve({communitySlug: 'test', attachmentId: 'image'})};
(async () => {
  const cases = [
    ['identity', 'TRADERLINK_WORKSPACE_ACCESS_DENIED'],
    ['identity', 'TRADERLINK_AUTH_SESSION_INVALID'],
    ['identity', 'TRADERLINK_DASHBOARD_ACCESS_DENIED'],
    ['viewer', 'TRADERLINK_WORKSPACE_NOT_FOUND'],
    ['image', 'TRADERLINK_WORKSPACE_ACCESS_DENIED'],
    ['image', 'TRADERLINK_ACCOUNT_ACCESS_DENIED'],
    ['image', 'TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED'],
  ];
  for (const [at, code] of cases) {
    failureAt = at; failure = denied(code); databaseReads = 0;
    const response = await output.GET(request, context);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    if (at === 'identity') assert.equal(databaseReads, 0);
  }
  failureAt = null; missingCommunity = true;
  assert.equal((await output.GET(request, context)).status, 404);
  missingCommunity = false;
  const response = await output.GET(request, context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1,2,3]);
  filename = '图表 📈 "review".png';
  const unicode = await output.GET(request, context);
  assert.equal(unicode.status, 200);
  assert.ok(unicode.headers.get('Content-Disposition').includes(`filename*=UTF-8''${encodeURIComponent(filename)}`));
  assert.deepEqual([...new Uint8Array(await unicode.arrayBuffer())], [1,2,3]);
  failureAt = 'image'; failure = denied('TRADERLINK_PLATFORM_SCHEMA_MISMATCH');
  await assert.rejects(output.GET(request, context), error => error === failure);
  failure = new Error('Unexpected runtime failure');
  await assert.rejects(output.GET(request, context), error => error === failure);
  console.log('PASS: anonymous/invalid/denied/missing image responses, authorized bytes, Unicode filenames, no-store and unexpected error propagation');
})().catch(error => {console.error(error); process.exitCode = 1;});
