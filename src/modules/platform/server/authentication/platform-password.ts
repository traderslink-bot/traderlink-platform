import { argon2id, hash, verify } from "argon2";

// Keep memory work off the event loop and bound allocations across requests.
const MAX_HASH_CONCURRENCY = 2;
let active = 0;
const waiters: Array<() => void> = [];
async function bounded<T>(operation: () => Promise<T>): Promise<T> {
  if (active >= MAX_HASH_CONCURRENCY) {
    if (waiters.length >= 8)
      throw new Error("Authentication is busy. Try again shortly.");
    await new Promise<void>((resolve) => waiters.push(resolve));
  } else active++;
  try {
    return await operation();
  } finally {
    const next = waiters.shift();
    if (next) next();
    else active--;
  }
}
export function validatePlatformPassword(
  password: unknown,
): asserts password is string {
  if (
    typeof password !== "string" ||
    [...password].length < 8 ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    throw new Error(
      "Use a password of at least 8 characters, up to 1,024 bytes.",
    );
  }
}
export async function hashPlatformPassword(password: string): Promise<string> {
  validatePlatformPassword(password);
  return bounded(() =>
    hash(password, {
      type: argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    }),
  );
}
export async function verifyPlatformPassword(
  passwordHash: string,
  password: unknown,
): Promise<boolean> {
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") > 1024 ||
    !passwordHash.startsWith("$argon2id$")
  )
    return false;
  return bounded(async () => {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  });
}
