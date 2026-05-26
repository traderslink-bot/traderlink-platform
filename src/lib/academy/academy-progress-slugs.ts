import progressSlugAliasesData from "../../../academy/_data/progress-slug-aliases.json";

type ProgressSlugAlias = {
  old_slug: string;
  current_slug: string;
};

type ProgressSlugAliasesJson = {
  aliases: ProgressSlugAlias[];
};

const progressAliases = (progressSlugAliasesData as ProgressSlugAliasesJson)
  .aliases;
const currentSlugByOldSlug = new Map(
  progressAliases.map((alias) => [
    normalizeAcademyProgressSlug(alias.old_slug),
    normalizeAcademyProgressSlug(alias.current_slug),
  ]),
);
const oldSlugsByCurrentSlug = progressAliases.reduce<Map<string, string[]>>(
  (aliases, alias) => {
    const currentSlug = normalizeAcademyProgressSlug(alias.current_slug);
    const oldSlug = normalizeAcademyProgressSlug(alias.old_slug);
    const oldSlugs = aliases.get(currentSlug) ?? [];
    oldSlugs.push(oldSlug);
    aliases.set(currentSlug, oldSlugs);
    return aliases;
  },
  new Map(),
);

export function normalizeAcademyProgressSlug(slug: string): string {
  const trimmed = slug.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function getCanonicalProgressLessonSlug(slug: string): string {
  const normalizedSlug = normalizeAcademyProgressSlug(slug);

  return currentSlugByOldSlug.get(normalizedSlug) ?? normalizedSlug;
}

export function getProgressStorageSlugsForLesson(slug: string): string[] {
  const canonicalSlug = getCanonicalProgressLessonSlug(slug);

  return [
    canonicalSlug,
    ...(oldSlugsByCurrentSlug.get(canonicalSlug) ?? []),
  ];
}

export function expandCompletedLessonSlugs(slugs: string[]): string[] {
  const expandedSlugs = new Set<string>();

  for (const slug of slugs) {
    const normalizedSlug = normalizeAcademyProgressSlug(slug);
    expandedSlugs.add(normalizedSlug);
    expandedSlugs.add(getCanonicalProgressLessonSlug(normalizedSlug));
  }

  return [...expandedSlugs];
}
