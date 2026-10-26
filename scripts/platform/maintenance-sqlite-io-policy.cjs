"use strict";

const { resolve, isAbsolute } = require("node:path");

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
