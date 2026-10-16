const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/onboarding-actions.ts'), 'utf8');
const output = {};
let match = true, writes = 0, identityFails = false, linked = true, verified = 0;
const database = {
  transaction: fn => ({immediate: fn}),
  prepare(sql) {
    assert.match(sql, /platform_auth_identities/);
    assert.match(sql, /auth_provider='discord'/);
    return {get(user) {
      assert.equal(user, 'owner');
      return linked ? {auth_subject: 'discord-owner'} : undefined;
    }};
  },
};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {
  exports: output, process: {env: {TRADERLINK_DISCORD_BOT_TOKEN:'synthetic-test-token'}},
  require(id) {
    if(id === 'next/cache') return {revalidatePath() {}};
    if(id === 'next/navigation') return {redirect(url) {throw Object.assign(new Error('redirect'), {url});}};
    if(id.endsWith('/require-platform-request-scope')) return {requireTraderLinkPlatformPageIdentity() {if(identityFails) throw new Error('identity denied'); return {scope: {userId: 'owner'}};}};
    if(id.endsWith('/open-platform-database')) return {withPlatformDatabase: (_options, run) => run(database)};
    if(id.endsWith('/platform-migration-contract')) return {createCanonicalUtcTimestamp: () => '2026-10-10T17:00:00.000Z'};
    if(id.endsWith('/community-launch-policy')) return {isApprovedCommunityGuild: guild => guild==='1433570740430573642'};
    if(id.endsWith('/community-onboarding-service')) return {
      verifyCommunityOwner: async (guild,subject,token) => {assert.equal(guild,'1433570740430573642');assert.equal(subject,'discord-owner');assert.equal(token,'synthetic-test-token');verified++;return {verified:true};},
      onboardApprovedCommunity: (_db,input) => {assert.equal(input.userId,'owner');assert.equal(input.evidence.verified,true);assert.equal(input.slug,undefined);assert.equal(input.displayName,undefined);if(match)return {slug:'existing-community'};writes++;throw new Error('normal verified creation');},
    };
    if(id.endsWith('/traderlink-community-repository')) return {TraderLinkCommunityRepository: class {createFromVerifiedDiscordOwner() {writes++; throw new Error('normal verified creation');}}};
    if(id.endsWith('/traderlink-community-platform-repository')) return {};
    throw new Error(`Unexpected import ${id}`);
  },
});
const form = new FormData(); form.set('discordGuildId', '1433570740430573642');
(async () => {
  await assert.rejects(output.onboardDiscordCommunityAction(form), e => e.url === '/communities/existing-community/manage');
  assert.equal(writes, 0, 'Reentry must not reset settings, roles, grants, channels or display name');
  match = false;
  await assert.rejects(output.onboardDiscordCommunityAction(form), /normal verified creation/);
  assert.equal(writes, 1, 'Absent or unauthorized existing result uses the verified creation boundary');
  assert.equal(verified,2,'Both reentry and creation require fresh owner verification');
  identityFails = true;
  await assert.rejects(output.onboardDiscordCommunityAction(form), /identity denied/);
  identityFails = false; form.set('discordGuildId', '999999999999999999');
  await assert.rejects(output.onboardDiscordCommunityAction(form), /not been approved/);
  form.set('discordGuildId','1433570740430573642'); linked=false;
  await assert.rejects(output.onboardDiscordCommunityAction(form), /Discord account connection required/);
  assert.equal(verified,2,'Unapproved and unlinked requests never reach Discord verification');
  assert.equal(writes, 1);
  console.log('PASS: fresh-owner action reentry, creation-service boundary, identity/allowlist/linked-account denial; service mutation proof is in launch-foundation fixture');
})().catch(error => {console.error(error); process.exitCode = 1;});
