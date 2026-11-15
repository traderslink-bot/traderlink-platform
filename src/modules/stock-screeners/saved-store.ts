import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { constants, closeSync, fsyncSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isObject, MAX_SAVED, parseDefinition, type SavedScreens } from "./contracts";

const MAX_BYTES = 100_000;
export const SAVED_SCREEN_ID = /^[a-f0-9-]{36}$/;
const missing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === "ENOENT";

function directoryCheck(directory: string) {
  if (!lstatSync(directory).isDirectory()) throw Error("saved_unavailable");
}

export function savedScreenOwnerKey(userId: string) {
  return createHash("sha256").update(userId).digest("hex");
}

export function parseSaved(input: unknown, legacy = false): SavedScreens {
  if (!isObject(input) || typeof input.revision !== "number" || !Number.isSafeInteger(input.revision)
    || input.revision < 0 || input.revision >= Number.MAX_SAFE_INTEGER - 1
    || !Array.isArray(input.screens) || input.screens.length > MAX_SAVED) throw Error("invalid_saved");
  const ids = new Set<string>();
  const screens = input.screens.map(screen => {
    if (!isObject(screen) || typeof screen.id !== "string" || !SAVED_SCREEN_ID.test(screen.id) || ids.has(screen.id)
      || typeof screen.name !== "string" || !screen.name.trim() || screen.name.trim().length > 70) throw Error("invalid_saved");
    ids.add(screen.id);
    const original = screen.definition;
    const definition = legacy && isObject(original) && ["small", "list"].some(scope => scope === original.universe)
      && Array.isArray(original.rules)
      ? {
        ...original,
        universe: original.universe === "small" ? "all" : original.universe,
        rules: [...original.rules, { metric: "cap", operator: "lt", value: 200_000_000 }],
      }
      : original;
    return { id: screen.id, name: screen.name.trim(), definition: parseDefinition(definition) };
  });
  if (input.defaultId !== null && (typeof input.defaultId !== "string" || !ids.has(input.defaultId))) throw Error("invalid_saved");
  return { revision: input.revision, defaultId: input.defaultId, screens };
}

export function readSaved(directory: string, userId: string): SavedScreens {
  return readSavedByOwnerKey(directory, savedScreenOwnerKey(userId));
}

export function readSavedByOwnerKey(directory: string, ownerKey: string): SavedScreens {
  if (!/^[a-f0-9]{64}$/.test(ownerKey)) throw Error("saved_unavailable");
  let file: number;
  try {
    directoryCheck(directory);
    file = openSync(join(directory, ownerKey + ".json"), constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (missing(error)) return { revision: 0, defaultId: null, screens: [] };
    throw error;
  }
  try {
    const stat = fstatSync(file);
    if (!stat.isFile() || stat.size > MAX_BYTES) throw Error("saved_unavailable");
    const input: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (!isObject(input) || (input.version !== undefined && input.version !== 1 && input.version !== 2)) throw Error("saved_unavailable");
    return parseSaved(input, input.version !== 2);
  } finally {
    closeSync(file);
  }
}

export function writeSaved(directory: string, userId: string, input: SavedScreens): SavedScreens {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  directoryCheck(directory);
  if (readSaved(directory, userId).revision !== input.revision) throw Error("saved_conflict");
  const saved = { ...input, revision: input.revision + 1 };
  const bytes = JSON.stringify({ version: 2, ...saved });
  if (Buffer.byteLength(bytes) > MAX_BYTES) throw Error("invalid_saved");
  const target = join(directory, savedScreenOwnerKey(userId) + ".json"), temp = target + "." + randomUUID() + ".tmp";
  try {
    const fd = openSync(temp, "wx", 0o600);
    try {
      writeFileSync(fd, bytes);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(temp, target);
    const dir = openSync(directory, constants.O_RDONLY | constants.O_DIRECTORY);
    try {
      fsyncSync(dir);
    } finally {
      closeSync(dir);
    }
  } finally {
    try { unlinkSync(temp); } catch (error) { if (!missing(error)) throw error; }
  }
  return saved;
}
