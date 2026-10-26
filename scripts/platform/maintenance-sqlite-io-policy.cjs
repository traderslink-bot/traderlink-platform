"use strict";

const { resolve, isAbsolute } = require("node:path");
const fs = require("node:fs");

// One isolated maintenance process only. Never install in the web application.
// cache_size is connection-local; no persistent SQLite setting is changed.
function installMaintenanceSqliteIoPolicy(Database, options) {
  const paths = new Map(options.paths.map(({ path, role }) => {
    if (!isAbsolute(path) || typeof role !== "string" || !role) throw new Error("maintenance_sqlite_path_invalid");
    return [resolve(path), role];
  }));
  const cacheKiB = options.cacheKiB ?? 262144;
  if (!Number.isInteger(cacheKiB) || cacheKiB < 16000 || cacheKiB > 262144) throw new Error("maintenance_sqlite_cache_invalid");
  const original = Database.prototype.pragma;
  const configured = new WeakSet();
  const warmed = new WeakSet();
  const emit = (value) => { try { options.emit?.(value); } catch { /* Logging never changes a safety result. */ } };
  function pragma(source, optionsArg) {
    const role = paths.get(this.name);
    if (!role) return original.call(this, source, optionsArg);
    if (!configured.has(this)) {
      original.call(this, `cache_size = -${cacheKiB}`);
      configured.add(this);
      emit({ stage: "maintenance_sqlite_connection", role, cacheKiB });
    }
    const check = typeof source === "string" ? /^\s*(foreign_key_check|quick_check)\b/iu.exec(source)?.[1].toLowerCase() : null;
    if (!check) return original.call(this, source, optionsArg);
    if (options.prewarm === true && !warmed.has(this)) {
      warmed.add(this);
      const warmStart = performance.now();
      let fd;
      try {
        emit({ stage: "maintenance_sequential_read", role, status: "started" });
        const expected = fs.lstatSync(this.name);
        if (!expected.isFile() || expected.isSymbolicLink()) throw new Error("maintenance_prewarm_file_invalid");
        fd = fs.openSync(this.name, "r");
        const actual = fs.fstatSync(fd);
        if (!actual.isFile() || actual.dev !== expected.dev || actual.ino !== expected.ino) throw new Error("maintenance_prewarm_identity_changed");
        const buffer = Buffer.alloc(1024 * 1024);
        let bytes = 0;
        for (;;) { const n = fs.readSync(fd, buffer, 0, buffer.length, null); if (n === 0) break; bytes += n; }
        emit({ stage: "maintenance_sequential_read", role, status: "completed", bytes, durationMs: Math.round(performance.now() - warmStart) });
      } catch {
        // Advisory only. Native integrity checks still run and decide validity.
        emit({ stage: "maintenance_sequential_read", role, status: "failed", durationMs: Math.round(performance.now() - warmStart) });
      } finally { if (fd !== undefined) { try { fs.closeSync(fd); } catch { /* Advisory read never replaces native verification. */ } } }
    }
    const start = performance.now();
    emit({ stage: "maintenance_integrity_check", role, check, status: "started" });
    try {
      const result = original.call(this, source, optionsArg);
      emit({ stage: "maintenance_integrity_check", role, check, status: "completed", durationMs: Math.round(performance.now() - start) });
      return result;
    } catch (error) {
      emit({ stage: "maintenance_integrity_check", role, check, status: "failed", durationMs: Math.round(performance.now() - start) });
      throw error;
    }
  }
  Database.prototype.pragma = pragma;
  return () => {
    if (Database.prototype.pragma !== pragma) throw new Error("maintenance_sqlite_policy_collision");
    Database.prototype.pragma = original;
  };
}

module.exports = { installMaintenanceSqliteIoPolicy };
