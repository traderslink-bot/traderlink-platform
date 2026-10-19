const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = process.cwd();
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(name) : /\.(ts|tsx)$/.test(name) ? [name] : [];
  });
}
// Keep the checkpoint meaningful after its files have been committed.
const authentication = 'src/modules/platform/server/authentication';
const stable = [
  ...sources('app/login'),
  ...sources('app/(member)/account/login'),
  ...sources('app/api/auth/email'),
  ...sources('app/api/auth/connections'),
  ...sources('app/api/auth/google'),
  ...sources(authentication).filter(name => /platform-(login|google-oauth|password|public-origin|email-route|discord-reauth)/.test(name)),
  `${authentication}/require-platform-request-scope.ts`,
  'src/modules/platform/server/membership/platform-membership-access.ts',
  'src/modules/platform/server/membership/platform-membership-access.test.ts',
  'src/modules/platform/login-form.test.ts',
];
const changed = [
  ...cp.execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).split('\n'),
  ...cp.execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\n'),
].filter(name => /\.(ts|tsx)$/.test(name) && fs.existsSync(name));
const ambient = parsed.fileNames.filter(name => name.endsWith('.d.ts') && !name.includes('/.next'));
const names = [...new Set([...stable, ...changed, ...ambient])];
const program = ts.createProgram(names, {
  ...parsed.options,
  noEmit: true,
  incremental: false,
  types: [...new Set([...(parsed.options.types ?? []), 'node'])],
});
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCurrentDirectory: () => root,
  getCanonicalFileName: name => name,
  getNewLine: () => '\n',
}));
console.log('Focused source roots:', names.length);
console.log('Focused source diagnostics:', diagnostics.length);
process.exitCode = diagnostics.length ? 1 : 0;
