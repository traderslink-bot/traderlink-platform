export class PlatformProfileNameError extends Error {
  constructor(public readonly code: "invalid" | "taken") {
    super(code === "taken"
      ? "That profile name is already taken."
      : "Enter a profile name between 1 and 120 characters, without control characters.");
  }
}

export function profileNameKey(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

export function normalizeProfileName(value: unknown): string {
  if (typeof value !== "string" || value.length > 512) throw new PlatformProfileNameError("invalid");
  const name = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (!name || name.length > 120 || /[\p{Cc}\p{Cf}]/u.test(value)) {
    throw new PlatformProfileNameError("invalid");
  }
  return name;
}
