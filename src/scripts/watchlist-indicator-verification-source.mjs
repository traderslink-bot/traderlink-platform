import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
/** Optional immutable integration-tree input; never changes the checkout. */
export async function readIndicatorVerificationSource(url) {
  const tree = process.env.TRADERLINK_INDICATOR_VERIFY_TREE;
  if (!tree) return readFile(url, 'utf8');
  if (!/^[0-9a-f]{40}$/u.test(tree)) throw Error('Invalid verification tree');
  const path = relative(root, fileURLToPath(url)).replaceAll('\\', '/');
  if (path.startsWith('../')) throw Error('Verification source outside repository');
  return execFileSync('git', ['show', `${tree}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 2_000_000 });
}
