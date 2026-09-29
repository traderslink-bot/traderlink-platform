const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
async function check(file, dedicated, expected) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!source.includes('process.env.DISCORD_CLIENT_ID'));
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const output = {};
  vm.runInNewContext(compiled, { exports: output,
    process: { env: { DISCORD_CLIENT_ID: 'old-login-app', TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID: dedicated } },
    require(id) {
      if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (id === 'next/navigation') return { notFound() { throw new Error('Unexpected access denial'); } };
      if (id.endsWith('/traderlink-community-platform-contracts')) return { TRADERLINK_COMMUNITY_SECTIONS: ['channels'] };
      if (id.endsWith('/community-dashboard')) return { CommunityDashboard: 'dashboard' };
      if (id.endsWith('/community-dashboard-loader')) return { loadCommunityDashboard: async () => ({ isReview: false, snapshot: { viewer: { capabilities: [] }, community: { isOwner: true } } }) };
      throw new Error(`Unexpected import ${id}`);
    },
  });
  const result = await output.default({ params: Promise.resolve({ communitySlug: 'test-community', section: ['manage', 'channels'] }) });
  assert.equal(result.props.discordClientId, expected);
}
(async () => {
  for (const file of ['app/(dashboard)/communities/[communitySlug]/page.tsx', 'app/(dashboard)/communities/[communitySlug]/[...section]/page.tsx']) {
    await check(file, '1554300060483715162', '1554300060483715162');
    await check(file, ' 1554300060483715162 ', '1554300060483715162');
    await check(file, undefined, null);
    await check(file, '', null);
    await check(file, '   ', null);
  }
  console.log('PASS: ten Communities install identity cases; no OAuth fallback');
})().catch(error => { console.error(error); process.exitCode = 1; });
