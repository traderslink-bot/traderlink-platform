"use strict";
/** Root-reviewed stage operator only. Secrets arrive through bounded private
 * stdin and are never echoed or passed in argv. No public route or env rewrite. */
const fs = require("node:fs");
const crypto = require("node:crypto");
(async () => {
  if (process.argv.length !== 2 || process.getuid?.() !== 1001 || process.cwd() !== "/app") throw Error("target");
  const path = "/app/private-paid-qa-controller.cjs";
  const before = fs.lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || (before.mode & 0o022)) throw Error("bundle");
  const fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  let bytes;
  try { const opened = fs.fstatSync(fd); if (opened.ino !== before.ino || opened.dev !== before.dev || opened.size > 16 * 1024 * 1024) throw Error("bundle");
    bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd); if (after.ino !== opened.ino || after.size !== bytes.length || after.mtimeMs !== opened.mtimeMs) throw Error("bundle");
  } finally { fs.closeSync(fd); }
  const chunks = []; let count = 0;
  for await (const chunk of process.stdin) { count += chunk.length; if (count > 131072) throw Error("input"); chunks.push(chunk); }
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  if (input.operatorSha256 !== hash) throw Error("bundle");
  const current = fs.lstatSync(path);
  if (current.ino !== before.ino || current.dev !== before.dev || current.mtimeMs !== before.mtimeMs || current.size !== before.size) throw Error("bundle");
  // Execute the exact verified bytes rather than reopening a mutable pathname.
  const Module = require("node:module");
  const loaded = new Module(path, module);
  loaded.filename = path;
  loaded.paths = Module._nodeModulePaths("/app");
  loaded._compile(bytes.toString("utf8"), path);
  const { runPartnerAlertHostedQaCommand } = loaded.exports;
  const result = await runPartnerAlertHostedQaCommand(input);
  process.stdout.write(JSON.stringify({ kind: "paid_hosted_qa_result", result }) + "\n");
})().catch(() => { process.stderr.write("Paid hosted QA did not complete. Review the private run receipt.\n"); process.exitCode = 1; });
