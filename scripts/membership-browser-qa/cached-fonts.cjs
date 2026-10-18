// Reuse actual public Geist files from a previous Codespaces build, never fake bytes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const cache = process.env.MEMBERSHIP_QA_FONT_CACHE;
assert.equal(cache, '/workspaces/private-data/membership-qa-fixtures/font-cache');
const styles = JSON.parse(fs.readFileSync(path.join(cache, 'styles.json'), 'utf8'));
module.exports = new Proxy({}, { get: (_, input) => {
  if (typeof input !== 'string' || !input.startsWith('https://fonts.googleapis.com/')) return undefined;
  const family = new URL(input).searchParams.get('family')?.split(':')[0];
  assert(['Geist', 'Geist Mono'].includes(family), 'Unexpected QA font family');
  return styles[family];
} });
