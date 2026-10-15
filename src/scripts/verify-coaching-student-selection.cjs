const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/student-coaching-workspace.tsx'), 'utf8');
const output = {};
let selection;
const jsx = (type, props, key) => ({type, props, key});
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}}).outputText, {
  exports: output,
  require(id) {
    if(id === 'react') return {useState: initial => [selection ?? initial, value => {selection = value;} ]};
    if(id === 'react/jsx-runtime') return {jsx, jsxs: jsx};
    return new Proxy({}, {get: (_target, key) => String(key)});
  },
});
const row = (relationshipId, studentUserId = 'student', status = 'active') => ({relationshipId, studentUserId, status, coachDisplayName: `Coach ${relationshipId}`, planName: `Plan ${relationshipId}`});
const snapshot = {viewer: {userId: 'student'}, relationships: [row('a'), row('b'), row('foreign', 'other-student'), row('ended', 'student', 'ended')]};
const render = () => output.StudentCoachingWorkspace({snapshot, isReview: false});
let tree = render();
let [selector, workspace] = tree.props.children;
assert.equal(selector.props.label, 'Coach and plan');
assert.deepEqual(Array.from(selector.props.children, item => item.props.value), ['a', 'b', 'ended']);
assert.equal(workspace.props.relationshipId, 'a');
assert.equal(workspace.key, 'a');
assert.equal(tree.props.children[2].props.selectedRelationshipId, 'a', 'Journal sharing follows the selected coach');
selector.props.onChange({target: {value: 'b'}});
tree = render();
[selector, workspace] = tree.props.children;
assert.equal(selector.props.value, 'b');
assert.equal(workspace.props.relationshipId, 'b');
assert.equal(workspace.key, 'b', 'Switching relationships remounts the scoped child workspace');
assert.equal(tree.props.children[2].props.selectedRelationshipId, 'b', 'Changing coaches changes Journal sharing scope');
selection = 'foreign';
assert.equal(render().props.children[1].props.relationshipId, 'a', 'Foreign selection falls back to own active relationship');
selection = 'removed';
assert.equal(render().props.children[1].props.relationshipId, 'a', 'Stale selection falls back safely');
snapshot.relationships = [row('a')];
selection = undefined;
assert.equal(render().props.children[0], null, 'One relationship does not need a selector');
snapshot.relationships = [row('foreign', 'other-student'), row('ended', 'student', 'ended')];
assert.equal(render().props.children[1].props.relationshipId, 'ended', 'Original student can select retained ended history');
snapshot.relationships = [row('foreign', 'other-student')];
tree = render();
assert.equal(tree.props.children[0].props.title, 'No active coaching');
assert.equal(tree.props.children[1].props.selectedRelationshipId, '', 'No relationship cannot inherit another coach sharing target');
console.log('PASS: own active and ended coach/plan options, switching and remounting, foreign/stale fallback, single and empty states');
