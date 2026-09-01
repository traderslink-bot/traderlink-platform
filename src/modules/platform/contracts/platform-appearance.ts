export const PLATFORM_APPEARANCE_MODES = Object.freeze([
  "light",
  "dark",
] as const);

export type PlatformAppearance = typeof PLATFORM_APPEARANCE_MODES[number];

export function isPlatformAppearance(value: unknown): value is PlatformAppearance {
  return typeof value === "string" &&
    (PLATFORM_APPEARANCE_MODES as readonly string[]).includes(value);
}
