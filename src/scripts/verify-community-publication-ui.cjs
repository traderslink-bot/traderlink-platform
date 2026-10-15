// Small DOM-only component check: no dev server, browser, database or network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement; global.FormData = dom.window.FormData;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let networkCalls = 0;
global.fetch = async () => { networkCalls++; throw new Error('Network forbidden'); };
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
const rootPath = path.resolve(__dirname, '../..');
function component(relative) {
  const filename = path.join(rootPath, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, reportDiagnostics: true, fileName: filename });
  assert.equal((compiled.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}
async function main() {
  const { CommunityPublicationForm } = component('app/(dashboard)/communities/community-publication-form.tsx');
  const serverMarkup=require('react-dom/server').renderToString(React.createElement(CommunityPublicationForm,{action:async()=>({status:'idle',message:''})},React.createElement('button',{type:'submit'},'Save')));
  assert.match(serverMarkup,/<fieldset[^>]*disabled=""/,'Submission is disabled until hydration attaches its handler');
  assert.match(serverMarkup,/<form[^>]*method="post"/,'The fallback never puts publication fields in a GET URL');
  const root = createRoot(document.getElementById('root'));
  const requests = []; let resolve; let reject;
  const action = data => { requests.push(Object.fromEntries(data)); return new Promise((yes, no) => { resolve = yes; reject = no; }); };
  await act(async () => root.render(React.createElement(CommunityPublicationForm, { action },
    React.createElement('input', { name: 'title', defaultValue: 'Keep my entry' }),
    React.createElement('button', { name: 'status', value: 'published', type: 'submit' }, 'Publish alert'))));
  const form = document.querySelector('form'); const button = form.querySelector('button[type=submit]');
  const submit = () => form.dispatchEvent(new dom.window.SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: button }));
  await act(async () => { submit(); submit(); });
  assert.equal(requests.length, 1); assert.equal(document.querySelector('fieldset').disabled, true);
  assert.match(document.body.textContent, /Publishing/);
  await act(async () => reject(new Error('Simulated transport interruption')));
  assert.equal(form.querySelector('input').value, 'Keep my entry');
  assert.equal(document.querySelector('fieldset').disabled, false);
  assert.match(document.body.textContent, /couldn't confirm the save/);
  await act(async () => submit());
  assert.equal(requests[1].requestId, requests[0].requestId);
  await act(async () => resolve({ status: 'success', message: 'Alert published.', href: '/communities/test/alerts/saved' }));
  assert.match(document.body.textContent, /Alert published/);
  assert.equal(document.querySelector('a').getAttribute('href'), '/communities/test/alerts/saved');
  await act(async () => root.unmount());
  const { CommunityWatchlistResearchFields } = component('app/(dashboard)/communities/community-watchlist-research-fields.tsx');
  const researchRoot = createRoot(document.getElementById('root'));
  await act(async () => researchRoot.render(React.createElement(CommunityWatchlistResearchFields, { initialSymbols: ['ABC'], initialResearch: { ABC: { notes: 'Saved note', research: 'Saved DD', sources: ['https://example.com/source'] } } })));
  const value = JSON.parse(document.querySelector('input[name=tickerResearch]').value);
  assert.equal(value.ABC.notes, 'Saved note'); assert.equal(value.ABC.research, 'Saved DD');
  assert.deepEqual(value.ABC.sources, ['https://example.com/source']);
  assert.ok([...document.querySelectorAll('label')].some(label => label.textContent === 'DD research'));
  await act(async () => researchRoot.unmount());
  assert.equal(networkCalls, 0);
  console.log(JSON.stringify({ ok: true, duplicateSubmitPrevented: true, pendingFeedback: true, entriesRetained: true, sameNonceRetry: true, successLink: true, tickerFieldsHydrated: true, networkCalls }));
  dom.window.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; dom.window.close(); });
