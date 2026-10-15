const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const timestamp = '2026-10-14T18:00:00.000Z';
let linked = true, identityDenied = false, botUnavailable = false, writes = 0, verifications = 0;
const database = {
  prepare(sql) {
    assert.match(sql, /platform_auth_identities/);
    return { get(userId) { assert.equal(userId, 'owner'); return linked ? { auth_subject: '123456' } : undefined; } };
  },
};
function load(file, dependencies) {
  const output = {};
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports: output, process: { env: { TRADERLINK_DISCORD_BOT_TOKEN: 'fixture-token' } },
    Date, require: dependencies });
  return output;
}
const actions = load('app/(dashboard)/communities/community-setup-feedback-actions.ts', id => {
  if (id === 'next/cache') return { revalidatePath() {} };
  if (id.endsWith('/require-platform-request-scope')) return {
    requireTraderLinkPlatformPageIdentity() { if (identityDenied) throw new Error('identity denied'); return { scope: { userId: 'owner' } }; },
  };
  if (id.endsWith('/open-platform-database')) return { withPlatformDatabase: (_options, run) => run(database) };
  if (id.endsWith('/community-launch-policy')) return { isApprovedCommunityGuild: id => id === '900001' };
  if (id.endsWith('/community-onboarding-service')) return {
    async verifyCommunityOwner(guildId, subject, token) {
      assert.equal(guildId, '900001'); assert.equal(subject, '123456'); assert.equal(token, 'fixture-token');
      verifications++; if (botUnavailable) throw new Error('bot unavailable');
      return { guildId, guildName: 'Verified Discord name', verifiedAtUtc: timestamp };
    },
    onboardApprovedCommunity(_database, input) {
      assert.equal(input.userId, 'owner'); assert.equal(input.evidence.guildName, 'Verified Discord name');
      assert.equal(input.slug, undefined, 'Browser-supplied URL names are not trusted');
      assert.equal(input.displayName, undefined, 'Browser-supplied server names are not trusted');
      writes++; return { slug: 'verified-discord-name' };
    },
  };
  if (id.startsWith('@/src/modules/communities/')) return {};
  throw new Error(`Unexpected dependency ${id}`);
});
const jsx = (type, props) => ({ type, props });
const component = load('app/(dashboard)/communities/community-connect-form.tsx', id => {
  if (id === 'react') return { useState: initial => [initial, () => {}] };
  if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (id.startsWith('@mui/material/')) return id.split('/').at(-1);
  if (id === './community-publication-form') return { CommunityPublicationForm: 'Form' };
  if (id === './community-setup-feedback-actions') return { connectCommunityWithFeedback: actions.connectCommunityWithFeedback };
  throw new Error(`Unexpected component dependency ${id}`);
});
const tree = component.CommunityConnectForm({ guilds: [{ guildId: '900001', guildName: 'Discord name' }], clientId: '123456' });
const fields = tree.props.children.props.children.filter(item => item.type === 'TextField');
assert.deepEqual(Array.from(fields, item => item.props.label), ['Discord server']);
assert.equal(fields[0].props.select, true, 'Servers are discovered choices, never a raw-ID input');
const install = tree.props.children.props.children.find(item => item.props?.href);
assert.match(install.props.href, /scope=bot%20applications.commands/);
assert.match(install.props.href, /guild_id=900001/);

void (async () => {
  const form = new FormData(); form.set('discordGuildId', '900001');
  form.set('displayName', 'Forged browser name'); form.set('slug', 'forged-url');
  assert.equal((await actions.connectCommunityWithFeedback(form)).href, '/communities/verified-discord-name/manage');
  assert.equal(writes, 1);
  botUnavailable = true;
  assert.equal((await actions.connectCommunityWithFeedback(form)).status, 'error');
  assert.equal(writes, 1, 'Failed bot ownership verification cannot create a community');
  botUnavailable = false; linked = false;
  assert.equal((await actions.connectCommunityWithFeedback(form)).status, 'error');
  linked = true; form.set('discordGuildId', 'foreign');
  assert.equal((await actions.connectCommunityWithFeedback(form)).status, 'error');
  assert.equal(verifications, 2, 'Unapproved/unlinked identities cannot invoke bot verification');
  identityDenied = true;
  await assert.rejects(actions.connectCommunityWithFeedback(form), /identity denied/);
  console.log('PASS: discovered server selection, bot install, automatic verified identity, forged-name rejection and no writes on denied setup');
})().catch(error => { console.error(error); process.exitCode = 1; });
