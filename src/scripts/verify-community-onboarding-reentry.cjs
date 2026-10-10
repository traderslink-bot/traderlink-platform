const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/onboarding-actions.ts'), 'utf8');
const output = {};
let match = true, writes = 0, identityFails = false;
const database = {
  transaction: fn => ({immediate: fn}),
  prepare(sql) {
    assert.match(sql, /c\.owner_user_id=\?/);
    assert.match(sql, /g\.guild_owner=1/);
    assert.match(sql, /g\.user_id=c\.owner_user_id/);
    return {get(guild, user) {
      assert.equal(guild, '1433570740430573642'); assert.equal(user, 'owner');
      return match ? {slug: 'existing-community'} : undefined;
    }};
  },
};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {
  exports: output,
  require(id) {
    if(id === 'next/cache') return {revalidatePath() {}};
    if(id === 'next/navigation') return {redirect(url) {throw Object.assign(new Error('redirect'), {url});}};
    if(id.endsWith('/require-platform-request-scope')) return {requireTraderLinkPlatformPageIdentity() {if(identityFails) throw new Error('identity denied'); return {scope: {userId: 'owner'}};}};
    if(id.endsWith('/open-platform-database')) return {withPlatformDatabase: (_options, run) => run(database)};
    if(id.endsWith('/platform-migration-contract')) return {createCanonicalUtcTimestamp: () => '2026-10-10T17:00:00.000Z'};
    if(id.endsWith('/traderlink-community-repository')) return {TraderLinkCommunityRepository: class {createFromVerifiedDiscordOwner() {writes++; throw new Error('normal verified creation');}}};
    if(id.endsWith('/traderlink-community-platform-repository')) return {};
    throw new Error(`Unexpected import ${id}`);
  },
});
const form = new FormData(); form.set('discordGuildId', '1433570740430573642'); form.set('slug', 'new-name'); form.set('displayName', 'New name');
(async () => {
  await assert.rejects(output.onboardDiscordCommunityAction(form), e => e.url === '/communities/existing-community/manage');
  assert.equal(writes, 0, 'Reentry must not reset settings, roles, grants, channels or display name');
  match = false;
  await assert.rejects(output.onboardDiscordCommunityAction(form), /normal verified creation/);
  assert.equal(writes, 1, 'Absent or unauthorized existing result uses the verified creation boundary');
  identityFails = true;
  await assert.rejects(output.onboardDiscordCommunityAction(form), /identity denied/);
  identityFails = false; form.set('discordGuildId', '999999999999999999');
  await assert.rejects(output.onboardDiscordCommunityAction(form), /limited to the private pilot/);
  assert.equal(writes, 1);
  console.log('PASS: verified-owner reentry, no setup reset, normal creation boundary, identity denial and private pilot restriction');
})().catch(error => {console.error(error); process.exitCode = 1;});
