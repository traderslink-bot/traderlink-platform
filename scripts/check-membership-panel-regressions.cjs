// Run in the isolated remote QA workspace, not against a live database.
// Exercises actual panel composition with inert UI and database-boundary stubs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const file = 'app/admin/journal/memberships/management-panels.tsx';
const source = fs.readFileSync(file, 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: file,
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics.length, 0, 'Panel must transpile');
let open = true;
let reads = 0;
const element = (type, props) => ({ type, props });
const helpers = {
  PrivateWatchlistAllowanceSettings: ({ database }) => {
    database.prepare('allowance helper').all(); reads++;
    return element('allowances', {});
  },
  WatchlistPlanSettings: ({ database }) => {
    database.prepare('watchlist helper').all(); reads++;
    return element('watchlist', {});
  },
};
const database = {
  prepare(sql) {
    assert.ok(open, 'Database read escaped the open-connection callback');
    return { all: () => sql.includes('v.version_number,v.public_description')
      ? [{ id: 'qa-draft', name: 'QA plan', version_number: 42, public_description: '' }]
      : [] };
  },
};
const exportsObject = {};
const load = name => {
  if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'fragment' };
  if (name.endsWith('/platform-membership-features')) return { readMembershipFeatures: () => [] };
  if (name.endsWith('/platform-membership-provider-readiness')) return { membershipWhopConfiguration: () => ({}) };
  if (name.endsWith('/membership-feature-copy')) return { readMembershipFeatureCopy: () => new Map() };
  if (name.endsWith('/private-watchlist-allowance-settings')) return helpers;
  if (name.endsWith('/watchlist-plan-settings')) return helpers;
  return new Proxy({ default: name }, { get: (target, key) => key in target ? target[key] : String(key) });
};
vm.runInNewContext(compiled.outputText, { exports: exportsObject, require: load }, { filename: file });
const panel = exportsObject.MembershipManagementPanels({ database, section: 'Features' });
assert.equal(reads, 2, 'Both database-bound helpers must execute inside the callback');
open = false;
function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(child => visit(child, callback));
  callback(node);
  if (typeof node.type === 'function') visit(node.type(node.props), callback);
  else visit(node.props?.children, callback);
}
visit(panel, () => {});
open = true;
const plans = exportsObject.MembershipManagementPanels({ database, section: 'Plans' });
open = false;
const titles = [];
visit(plans, node => { if (node.props?.title) titles.push(node.props.title); });
assert.ok(titles.includes('QA plan · Draft version 42'), 'Draft heading must identify its version');
console.log('PASS: database-bound panels compose before close; draft versions are distinguishable.');
