// Offline presentation regression: actual page query and component branches; no network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../..');
const jsx = (type, props, key) => ({type, props, key});
function load(file, dependencies, suffix = '', environment = {}) {
  const output = {};
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8') + suffix, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
  });
  assert.equal(result.diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
  vm.runInNewContext(result.outputText, {exports: output, process: {env: environment}, require: dependencies});
  return output;
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
}
function text(tree) { return JSON.stringify(tree); }
function common(id) {
  if (id === 'react/jsx-runtime') return {jsx, jsxs: jsx};
  if (id.startsWith('@mui/')) return {default: id.split('/').at(-1)};
  return null;
}
async function main() {
  const db = new Database(':memory:');
  try {
    const launchEnvironment = {TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS: '100,200,300,500,600'};
    const policy = load('src/modules/communities/server/community-launch-policy.ts', id => {
      throw new Error(`Unexpected policy dependency: ${id}`);
    }, '', launchEnvironment);
    db.exec(`CREATE TABLE traderlink_community_discord_guild_candidates(user_id TEXT, discord_guild_id TEXT, guild_name TEXT, guild_owner INTEGER);
      CREATE TABLE traderlink_communities(discord_guild_id TEXT, owner_user_id TEXT, slug TEXT);
      INSERT INTO traderlink_community_discord_guild_candidates VALUES
        ('owner','100','Connected',1),('owner','200','New',1),('owner','300','Different owner',1),
        ('owner','400','Not approved',1),('owner','500','Not owner',0),('other','600','Other candidate',1);
      INSERT INTO traderlink_communities VALUES ('100','owner','existing-room'),('300','other','private-room');`);
    const page = load('app/(dashboard)/communities/onboarding/page.tsx', id => {
      const value = common(id); if (value) return value;
      if (id.endsWith('/dashboard-ui')) return {DashboardPage:'Page', DashboardPanel:'Panel'};
      if (id.endsWith('/require-platform-request-scope')) return {requireTraderLinkPlatformServerComponentPageIdentity: async () => ({scope:{userId:'owner'}})};
      if (id.endsWith('/open-readonly-platform-database')) return {withReadonlyPlatformDatabase: (_options, run) => run(db)};
      if (id.endsWith('/community-launch-policy')) return policy;
      if (id === '../community-connect-form') return {CommunityConnectForm:'Connect'};
      throw new Error(id);
    });
    const rendered = await page.default();
    const guilds = nodes(rendered).find(item => item.type === 'Connect').props.guilds;
    assert.equal(guilds.length,3);
    assert(guilds.some(item => item.guildId === '200' && item.connectedSlug === null), 'An approved newly discovered owner needs no existing connection or bot evidence');
    assert(!guilds.some(item => ['400','500','600'].includes(item.guildId)), 'Approval cannot substitute for ownership or the current stable user');
    assert.equal(guilds.find(item => item.guildId === '100').connectedSlug,'existing-room');
    assert.equal(guilds.find(item => item.guildId === '300').connectedSlug,null,'Never expose another owner’s management destination');
    assert(!text(rendered).includes('private-room'));
    launchEnvironment.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = '100,300,500,600';
    const beforeAdmission = nodes(await page.default()).find(item => item.type === 'Connect').props.guilds;
    assert(!beforeAdmission.some(item => item.guildId === '200'), 'A persisted owned candidate can be hidden solely by operator admission');
    assert.equal(beforeAdmission.find(item => item.guildId === '100').connectedSlug, 'existing-room');
    launchEnvironment.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = '100,200,300,500,600';
    const afterAdmission = nodes(await page.default()).find(item => item.type === 'Connect').props.guilds;
    assert(afterAdmission.some(item => item.guildId === '200' && item.connectedSlug === null), 'Admission reveals the existing candidate without database repair');
    assert.equal(db.prepare('SELECT count(*) n FROM traderlink_communities').get().n, 2, 'Discovery must not create connections');
    launchEnvironment.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = 'invalid';
    const denied = await page.default();
    assert(!nodes(denied).some(item => item.type === 'Connect'));
    assert(text(denied).includes('No approved server available'), 'Malformed admission fails closed');
    launchEnvironment.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = '100,200,300,500,600';
    let selected;
    const form = load('app/(dashboard)/communities/community-connect-form.tsx', id => {
      const value = common(id); if (value) return value;
      if (id === 'react') return {useState: initial => [selected ?? initial, value => {selected = value;} ]};
      if (id === './community-publication-form') return {CommunityPublicationForm:'Form'};
      if (id === './community-setup-feedback-actions') return {connectCommunityWithFeedback: () => {throw new Error('No submissions allowed');}};
      if (id === './community-installation-actions' || id.endsWith('/contracts/community-installation-status')) return {};
      throw new Error(id);
    });
    const render = () => form.CommunityConnectForm({guilds,clientId:'123456'});
    let tree = render();
    assert(text(tree).includes('Server connected'));
    assert.equal(nodes(tree).find(item => item.props?.href).props.href,'/communities/existing-room/manage');
    assert(!text(tree).includes('Connect server')); assert(!text(tree).includes('Install TraderLink'));
    assert(!nodes(tree).some(item => item.type === 'Form'));
    nodes(tree).find(item => item.type === 'TextField').props.onChange({target:{value:'200'}});
    tree = render();
    assert(!text(tree).includes('Server connected'));
    const setup = nodes(tree).find(item => item.type === form.CommunityInstallationSetup);
    assert.equal(setup.props.guildId,'200');
    assert(setup.props.installUrl.includes('guild_id=200'));
    assert.equal(setup.key,'200','Reset installation and connection feedback when changing server');
    selected = '300'; tree = render();
    assert.equal(nodes(tree).find(item => item.type === form.CommunityInstallationSetup).key,'300');
    assert(!text(tree).includes('private-room'));
    selected = '100'; assert(text(render()).includes('Server connected'));
    const dashboard = load('app/(dashboard)/communities/community-dashboard.tsx', id => common(id) ?? new Proxy({}, {get: (_target,key) => String(key)}), '\nexport { Channels };');
    const snapshot = {community:{slug:'room',discordGuildId:'100'},channels:[]};
    const channels = resources => dashboard.Channels({snapshot,isReview:false,discordClientId:'123456',discordResources:resources});
    tree = channels({roles:[],channels:[{id:'1',name:'blocked',canPublish:false}]});
    assert(text(tree).includes('Discord app detected'));
    assert(!text(tree).includes('Install TraderLink Discord app'));
    for (const wording of ['View Channel','Send Messages','server owner','overrides','timeout','refresh this page']) assert(text(tree).includes(wording));
    assert(nodes(tree).find(item => item.type === 'MenuItem' && item.props.value === '1').props.disabled);
    assert(nodes(tree).find(item => item.type === 'Button' && item.props.type === 'submit').props.disabled);
    tree = channels({roles:[],channels:[{id:'2',name:'allowed',canPublish:true}]});
    assert.equal(nodes(tree).find(item => item.type === 'Button' && item.props.type === 'submit').props.disabled,false);
    assert(!text(tree).includes('For channels marked'));
    assert(text(channels({roles:[],channels:[]})).includes('No text or announcement channels'));
    assert(text(channels(null)).includes('Discord channels unavailable'));
    assert(text(channels(null)).includes('Install TraderLink Discord app'));
    console.log('PASS: owned connection discovery, cross-owner exclusion, connected/new server switching, correct submission identity, feedback reset and actionable channel/empty/failure states. Offline component/query proof only.');
  } finally {db.close();}
}
main().catch(error => {console.error(error);process.exitCode=1;});
