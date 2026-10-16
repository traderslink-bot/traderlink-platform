// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  hashPlatformPassword,
  verifyPlatformPassword,
  validatePlatformPassword,
} from "./platform-password";
describe("bounded password work", () => {
  it("accepts eight characters, rejects seven, and counts Unicode characters", async () => {
    expect(() => validatePlatformPassword("1234567")).toThrow("at least 8");
    expect(() => validatePlatformPassword("12345678")).not.toThrow();
    expect(() => validatePlatformPassword("😀".repeat(7))).toThrow();
    expect(() => validatePlatformPassword("😀".repeat(8))).not.toThrow();
    const hashed = await hashPlatformPassword("Eight123");
    expect(await verifyPlatformPassword(hashed, "Eight123")).toBe(true);
  });
  it("hashes with a unique salt and validates without blocking event-loop ticks", async () => {
    const password = "a long synthetic password for this test";
    let ticks = 0;
    const timer = setInterval(() => ticks++, 1);
    try {
      const [one, two] = await Promise.all([
        hashPlatformPassword(password),
        hashPlatformPassword(password),
      ]);
      expect(one).not.toBe(two);
      expect(one).toMatch(/^\$argon2id\$v=19\$/);
      expect(one.split("$")[3].split(",").sort()).toEqual([
        "m=19456",
        "p=1",
        "t=2",
      ]);
      expect(await verifyPlatformPassword(one, password)).toBe(true);
      expect(await verifyPlatformPassword(one, "wrong")).toBe(false);
      expect(ticks).toBeGreaterThan(1);
    } finally {
      clearInterval(timer);
    }
  });
  it("bounds inputs and rejects invalid or malformed hashes", async () => {
    expect(() => validatePlatformPassword("short")).toThrow();
    expect(() => validatePlatformPassword("a".repeat(1025))).toThrow();
    expect(await verifyPlatformPassword("$argon2id$bad", "a".repeat(15))).toBe(
      false,
    );
  });
  it("bounds concurrent password work and recovers after rejecting excess demand", async () => {
    const password = "a long synthetic password for queue testing";
    const pending = Array.from({ length: 10 }, () => hashPlatformPassword(password));
    await expect(hashPlatformPassword(password)).rejects.toThrow("Authentication is busy");
    const completed = await Promise.all(pending);
    expect(completed).toHaveLength(10);
    expect(await verifyPlatformPassword(completed[0], password)).toBe(true);
  });
});
