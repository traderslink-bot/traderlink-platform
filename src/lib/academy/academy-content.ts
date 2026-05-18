import fs from "node:fs";
import path from "node:path";

import appBridgesData from "../../../academy/_data/app-bridges.json";
import coursesData from "../../../academy/_data/courses.json";
import lessonMembershipsData from "../../../academy/_data/lesson-memberships.json";
import modulesData from "../../../academy/_data/modules.json";
import pathHubsData from "../../../academy/_data/path-hubs.json";
import visualOverridesData from "../../../academy/_data/visual-overrides.json";

const academyRoot = path.join(process.cwd(), "academy");

export type AcademyCourse = {
  course_id: string;
  course_slug: string;
  course_title: string;
  course_order: number;
  course_type: "academy_course" | "academy_path_hub_group";
  status: string;
  audience: string;
  course_outcome: string;
  recommended_previous_course: string | null;
  recommended_next_course: string | null;
  completion_mode: string;
  progress_model: string;
  display_model: string;
  visual_status: string;
  app_bridge_strength: "light" | "supporting" | "core" | string;
  hard_app_links_enabled: boolean;
};

export type AcademyModule = {
  course_id: string;
  module_id: string;
  module_title: string;
  module_order: number;
  module_type: string;
  display_behavior: string;
  progress_enabled: boolean;
};

export type AcademyLessonMembership = {
  lesson_slug: string;
  display_title: string;
  display_course_id: string;
  module_id: string;
  display_order: number;
  membership_type: "canonical" | "cross_listed" | string;
  canonical_course_id: string;
  completion_behavior: string;
  required_for_core_completion: boolean;
  counts_toward_course_progress: boolean;
  counts_toward_parent_progress: boolean;
  recommended_previous_in_context: string | null;
  recommended_next_in_context: string | null;
  lesson_card_variant: string;
  primary_visual_asset: string | null;
  app_bridge_card_id: string | null;
  hard_app_links_enabled: boolean;
};

export type AcademyPathHubStep = {
  step_id: string;
  step_order: number;
  step_type: "course" | "lesson" | string;
  target_id?: string;
  target_slug?: string;
  required_for_path_completion: boolean;
};

export type AcademyPathHub = {
  path_id: string;
  path_slug: string;
  path_title: string;
  path_type: string;
  display_order: number;
  status: string;
  path_goal: string;
  recommended_for: string;
  progress_model: string;
  hard_app_links_enabled: boolean;
  steps: AcademyPathHubStep[];
};

export type AcademyAppBridge = {
  app_bridge_card_id: string;
  scope: string;
  course_id: string | null;
  module_id: string | null;
  lesson_slug: string | null;
  enabled: boolean;
  bridge_strength: "light" | "supporting" | "core" | string;
  primary_surface: string;
  secondary_surfaces: string[];
  placement: string;
  route_key: string | null;
  hard_link_enabled: boolean;
  copy_variant: string;
  claim_safety_notes: string;
};

export type AcademyVisualOverride = {
  course_id: string;
  current_status: string;
  future_visual_need: string;
  primary_visual_asset: string | null;
  module_visual_assets: string[];
  launch_polish_needed: boolean;
  hard_asset_reference_ready: boolean;
};

export type AcademyFrontmatter = Record<
  string,
  string | string[] | number | boolean | null
>;

export type AcademyLesson = {
  slug: string;
  slugSegments: string[];
  title: string;
  description: string;
  body: string;
  frontmatter: AcademyFrontmatter;
  memberships: AcademyLessonMembership[];
  canonicalMembership: AcademyLessonMembership | null;
  previousLesson: AcademyLessonLink | null;
  nextLesson: AcademyLessonLink | null;
  visualAssets: string[];
  contexts: AcademyLessonContext[];
};

export type AcademyLessonLink = {
  slug: string;
  title: string;
};

export type AcademyLessonContext = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  displayOrder: number;
  membershipType: string;
  requiredForCoreCompletion: boolean;
};

export type AcademyCoursePage = {
  course: AcademyCourse;
  modules: Array<{
    module: AcademyModule;
    lessons: AcademyLessonMembership[];
  }>;
  previousCourse: AcademyCourse | null;
  nextCourse: AcademyCourse | null;
  bridge: AcademyAppBridge | null;
  visual: AcademyVisualOverride | null;
  requiredLessonCount: number;
  totalLessonCount: number;
};

export type AcademyPathHubPage = {
  hub: AcademyPathHub;
  steps: Array<
    | { step: AcademyPathHubStep; type: "course"; course: AcademyCourse }
    | { step: AcademyPathHubStep; type: "lesson"; lesson: AcademyLessonLink }
  >;
};

type CoursesJson = {
  courses: AcademyCourse[];
};

type ModulesJson = {
  modules: AcademyModule[];
};

type LessonMembershipsJson = {
  lesson_memberships: AcademyLessonMembership[];
};

type PathHubsJson = {
  path_hubs: AcademyPathHub[];
};

type AppBridgesJson = {
  app_bridges: AcademyAppBridge[];
};

type VisualOverridesJson = {
  visual_overrides: AcademyVisualOverride[];
};

const courses = (coursesData as CoursesJson).courses;
const modules = (modulesData as ModulesJson).modules;
const memberships = (lessonMembershipsData as LessonMembershipsJson)
  .lesson_memberships;
const pathHubs = (pathHubsData as PathHubsJson).path_hubs;
const appBridges = (appBridgesData as AppBridgesJson).app_bridges;
const visualOverrides = (visualOverridesData as VisualOverridesJson)
  .visual_overrides;
const launchCourseIds = new Set(["chart-reading-market-structure"]);

export function getAcademyCourses(): AcademyCourse[] {
  return courses
    .filter((course) => course.course_type === "academy_course")
    .toSorted((a, b) => a.course_order - b.course_order);
}

export function getAcademyCourseIds(): string[] {
  return getAcademyCourses().map((course) => course.course_id);
}

export function getLaunchAcademyCourseIds(): string[] {
  return getAcademyCourseIds().filter((courseId) =>
    launchCourseIds.has(courseId),
  );
}

export function isAcademyCourseLaunchReady(courseId: string): boolean {
  return launchCourseIds.has(courseId);
}

export function getAcademyCoursePage(
  courseId: string,
): AcademyCoursePage | null {
  const course = courses.find((item) => item.course_id === courseId);

  if (!course || course.course_type !== "academy_course") {
    return null;
  }

  const courseModules = modules
    .filter((item) => item.course_id === courseId)
    .toSorted((a, b) => a.module_order - b.module_order);
  const courseMemberships = memberships
    .filter((item) => item.display_course_id === courseId)
    .toSorted((a, b) => a.display_order - b.display_order);
  const moduleGroups = courseModules.map((module) => ({
    module,
    lessons: courseMemberships.filter(
      (lesson) => lesson.module_id === module.module_id,
    ),
  }));

  return {
    course,
    modules: moduleGroups,
    previousCourse: course.recommended_previous_course
      ? findCourse(course.recommended_previous_course)
      : null,
    nextCourse: course.recommended_next_course
      ? findCourse(course.recommended_next_course)
      : null,
    bridge:
      appBridges.find(
        (bridge) =>
          bridge.enabled &&
          bridge.scope === "course" &&
          bridge.course_id === courseId,
      ) ?? null,
    visual:
      visualOverrides.find((visual) => visual.course_id === courseId) ?? null,
    requiredLessonCount: courseMemberships.filter(
      (lesson) => lesson.required_for_core_completion,
    ).length,
    totalLessonCount: courseMemberships.length,
  };
}

export function getAcademyPathHubs(): AcademyPathHub[] {
  return pathHubs.toSorted((a, b) => a.display_order - b.display_order);
}

export function getAcademyPathHubIds(): string[] {
  return getAcademyPathHubs().map((hub) => hub.path_id);
}

export function getLaunchAcademyPathHubIds(): string[] {
  return [];
}

export function isAcademyPathHubLaunchReady(pathId: string): boolean {
  return getLaunchAcademyPathHubIds().includes(pathId);
}

export function getAcademyPathHubPage(
  pathId: string,
): AcademyPathHubPage | null {
  const hub = pathHubs.find((item) => item.path_id === pathId);

  if (!hub) {
    return null;
  }

  const steps = hub.steps
    .toSorted((a, b) => a.step_order - b.step_order)
    .flatMap<AcademyPathHubPage["steps"][number]>((step) => {
      if (step.step_type === "course" && step.target_id) {
        const course = findCourse(step.target_id);
        return course ? [{ step, type: "course", course }] : [];
      }

      if (step.step_type === "lesson" && step.target_slug) {
        const lesson = getLessonLink(step.target_slug);
        return lesson ? [{ step, type: "lesson", lesson }] : [];
      }

      return [];
    });

  return { hub, steps };
}

export function getAcademyLessonStaticParams(): Array<{ slug: string[] }> {
  const allSlugs = new Set<string>();

  for (const membership of memberships) {
    allSlugs.add(normalizeAcademySlug(membership.lesson_slug));
  }

  for (const hub of pathHubs) {
    allSlugs.add(normalizeAcademySlug(hub.path_slug));
  }

  return [...allSlugs].map((slug) => ({
    slug: slugToSegments(slug),
  }));
}

export function getLaunchAcademyLessonStaticParams(): Array<{ slug: string[] }> {
  const launchSlugs = new Set<string>();

  for (const membership of memberships) {
    if (launchCourseIds.has(membership.display_course_id)) {
      launchSlugs.add(normalizeAcademySlug(membership.lesson_slug));
    }
  }

  return [...launchSlugs].map((slug) => ({
    slug: slugToSegments(slug),
  }));
}

export function isAcademyLessonLaunchReady(lesson: AcademyLesson): boolean {
  return lesson.memberships.some((membership) =>
    launchCourseIds.has(membership.display_course_id),
  );
}

export function getAcademyLessonBySegments(
  segments: string[],
): AcademyLesson | null {
  return getAcademyLesson(segmentsToSlug(segments));
}

export function getAcademyLesson(slug: string): AcademyLesson | null {
  const normalizedSlug = normalizeAcademySlug(slug);
  const filePath = getMarkdownPathForSlug(normalizedSlug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseMarkdownFile(raw);
  const lessonMemberships = memberships
    .filter(
      (membership) =>
        normalizeAcademySlug(membership.lesson_slug) === normalizedSlug,
    )
    .toSorted((a, b) => a.display_order - b.display_order);
  const canonicalMembership =
    lessonMemberships.find(
      (membership) => membership.membership_type === "canonical",
    ) ??
    lessonMemberships[0] ??
    null;

  const title = stringValue(parsed.frontmatter.title) ?? getTitleFromBody(parsed.body);
  const description =
    stringValue(parsed.frontmatter.meta_description) ??
    stringValue(parsed.frontmatter.description) ??
    getDescriptionFromBody(parsed.body);

  const previousSlug =
    canonicalMembership?.recommended_previous_in_context ??
    stringValue(parsed.frontmatter.recommended_previous);
  const nextSlug =
    canonicalMembership?.recommended_next_in_context ??
    stringValue(parsed.frontmatter.recommended_next);

  return {
    slug: normalizedSlug,
    slugSegments: slugToSegments(normalizedSlug),
    title,
    description,
    body: parsed.body,
    frontmatter: parsed.frontmatter,
    memberships: lessonMemberships,
    canonicalMembership,
    previousLesson: previousSlug ? getLessonLink(previousSlug) : null,
    nextLesson: nextSlug ? getLessonLink(nextSlug) : null,
    visualAssets: stringArrayValue(parsed.frontmatter.visual_assets),
    contexts: lessonMemberships.flatMap((membership) => {
      const course = findCourse(membership.display_course_id);
      const academyModule = findModule(
        membership.display_course_id,
        membership.module_id,
      );

      if (!course || !academyModule) {
        return [];
      }

      return [
        {
          courseId: course.course_id,
          courseTitle: course.course_title,
          courseSlug: course.course_slug,
          moduleId: academyModule.module_id,
          moduleTitle: academyModule.module_title,
          displayOrder: membership.display_order,
          membershipType: membership.membership_type,
          requiredForCoreCompletion: membership.required_for_core_completion,
        },
      ];
    }),
  };
}

export function getAcademyLessonTitle(slug: string): string {
  return getLessonLink(slug)?.title ?? titleFromSlug(slug);
}

export function getAcademyAppBridgeForLesson(
  lesson: AcademyLesson,
): AcademyAppBridge | null {
  const directBridgeId = lesson.canonicalMembership?.app_bridge_card_id;

  if (directBridgeId) {
    const bridge = appBridges.find(
      (item) => item.enabled && item.app_bridge_card_id === directBridgeId,
    );

    if (bridge) {
      return bridge;
    }
  }

  const courseId =
    lesson.canonicalMembership?.display_course_id ??
    stringValue(lesson.frontmatter.academy_course);

  if (!courseId) {
    return null;
  }

  return (
    appBridges.find(
      (item) =>
        item.enabled && item.scope === "course" && item.course_id === courseId,
    ) ?? null
  );
}

export function getCourseTitle(courseId: string): string {
  return findCourse(courseId)?.course_title ?? titleFromSlug(courseId);
}

export function getCourseSlug(courseId: string): string {
  return findCourse(courseId)?.course_slug ?? `/academy/courses/${courseId}/`;
}

function findCourse(courseId: string): AcademyCourse | null {
  return courses.find((course) => course.course_id === courseId) ?? null;
}

function findModule(courseId: string, moduleId: string): AcademyModule | null {
  return (
    modules.find(
      (academyModule) =>
        academyModule.course_id === courseId &&
        academyModule.module_id === moduleId,
    ) ?? null
  );
}

function getLessonLink(slug: string): AcademyLessonLink | null {
  const normalizedSlug = normalizeAcademySlug(slug);
  const membership = memberships.find(
    (item) => normalizeAcademySlug(item.lesson_slug) === normalizedSlug,
  );

  if (membership) {
    return { slug: normalizedSlug, title: membership.display_title };
  }

  const filePath = getMarkdownPathForSlug(normalizedSlug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseMarkdownFile(raw);

  return {
    slug: normalizedSlug,
    title: stringValue(frontmatter.title) ?? getTitleFromBody(body),
  };
}

function getMarkdownPathForSlug(slug: string): string {
  const segments = slugToSegments(slug);
  return path.join(academyRoot, ...segments) + ".md";
}

function normalizeAcademySlug(slug: string): string {
  const trimmed = slug.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withAcademy = withLeadingSlash.startsWith("/academy/")
    ? withLeadingSlash
    : `/academy${withLeadingSlash}`;

  return withAcademy.endsWith("/") ? withAcademy : `${withAcademy}/`;
}

function slugToSegments(slug: string): string[] {
  return normalizeAcademySlug(slug)
    .replace(/^\/academy\//, "")
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);
}

function segmentsToSlug(segments: string[]): string {
  return normalizeAcademySlug(`/academy/${segments.join("/")}/`);
}

function parseMarkdownFile(raw: string): {
  frontmatter: AcademyFrontmatter;
  body: string;
} {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const end = raw.indexOf("\n---", 3);

  if (end === -1) {
    return { frontmatter: {}, body: raw.trim() };
  }

  return {
    frontmatter: parseFrontmatter(raw.slice(3, end)),
    body: raw.slice(end + 4).trim(),
  };
}

function parseFrontmatter(source: string): AcademyFrontmatter {
  const data: AcademyFrontmatter = {};
  let currentArrayKey: string | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const arrayItem = line.match(/^\s+-\s+(.*)$/);

    if (arrayItem && currentArrayKey) {
      const existing = data[currentArrayKey];
      const nextValue = cleanYamlValue(arrayItem[1]);
      data[currentArrayKey] = Array.isArray(existing)
        ? [...existing, String(nextValue)]
        : [String(nextValue)];
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);

    if (!pair) {
      continue;
    }

    const key = pair[1];
    const value = pair[2];

    if (value === "") {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    data[key] = cleanYamlValue(value);
    currentArrayKey = null;
  }

  return data;
}

function cleanYamlValue(value: string): string | number | boolean | null {
  const trimmed = value.trim();

  if (trimmed === "null") {
    return null;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function stringValue(value: AcademyFrontmatter[string]): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringArrayValue(value: AcademyFrontmatter[string]): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getTitleFromBody(body: string): string {
  const heading = body.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : "Academy Lesson";
}

function getDescriptionFromBody(body: string): string {
  const firstParagraph = body
    .split(/\n{2,}/)
    .find((paragraph) => !paragraph.trim().startsWith("#"));

  return firstParagraph
    ? firstParagraph.replace(/\s+/g, " ").trim().slice(0, 160)
    : "A TradersLink Academy lesson for practical trading education.";
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/^\/?academy\//, "")
    .replace(/\/$/, "")
    .split("/")
    .at(-1)!
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
