import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const dataDir = path.join(root, "academy/_data");

const allowedMembershipTypes = new Set([
  "canonical",
  "cross_listed",
  "submodule",
  "supporting",
  "path_step",
]);

const allowedCompletionBehaviors = new Set([
  "required",
  "library",
  "supporting",
  "optional",
]);

const allowedBridgeStrengths = new Set(["core", "supporting", "light", "none"]);

const allowedBridgeSurfaces = new Set([
  "Trade Review",
  "Risk Review",
  "Execution Review",
  "Coaching",
  "Analytics",
  "Journal Notes",
  "Playbook Builder",
  "News/Filing Review",
  "Session Review",
  "Progress/Academy",
]);

const allowedPathStepTypes = new Set([
  "course",
  "module",
  "submodule",
  "lesson",
  "review_checkpoint",
]);

const errors = [];
const warnings = [];

function readJson(name) {
  const file = path.join(dataDir, name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Could not read ${name}: ${error.message}`);
    return {};
  }
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function requireUnique(items, getKey, label) {
  const seen = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (key == null || key === "") {
      fail(`${label} contains a blank key.`);
      continue;
    }
    if (seen.has(key)) {
      fail(`${label} contains duplicate key: ${key}`);
      continue;
    }
    seen.set(key, item);
  }
  return seen;
}

function lessonSlugToMarkdownPath(slug) {
  if (!slug.startsWith("/academy/") || !slug.endsWith("/")) {
    fail(`Invalid lesson slug format: ${slug}`);
    return null;
  }
  return path.join(root, `${slug.slice(1, -1)}.md`);
}

function assetPathExists(assetPath) {
  if (!assetPath) return true;
  const normalized = assetPath.startsWith("/")
    ? path.join(root, "public", assetPath.slice(1))
    : path.join(root, assetPath);
  return fs.existsSync(normalized);
}

const coursesData = readJson("courses.json");
const modulesData = readJson("modules.json");
const membershipsData = readJson("lesson-memberships.json");
const pathHubsData = readJson("path-hubs.json");
const appBridgesData = readJson("app-bridges.json");
const visualOverridesData = readJson("visual-overrides.json");
const progressAliasesData = readJson("progress-slug-aliases.json");
const progressBaselineData = readJson("progress-slug-baseline.json");

const courses = coursesData.courses ?? [];
const modules = modulesData.modules ?? [];
const memberships = membershipsData.lesson_memberships ?? [];
const pathHubs = pathHubsData.path_hubs ?? [];
const appBridges = appBridgesData.app_bridges ?? [];
const visualOverrides = visualOverridesData.visual_overrides ?? [];
const progressAliases = progressAliasesData.aliases ?? [];
const protectedLaunchCourseIds = new Set(
  progressBaselineData.protected_launch_course_ids ?? [],
);
const protectedProgressSlugs = progressBaselineData.protected_lesson_slugs ?? [];

const courseById = requireUnique(courses, (course) => course.course_id, "courses");
const moduleByKey = requireUnique(
  modules,
  (module) => `${module.course_id}:${module.module_id}`,
  "modules",
);

const numberedOrders = new Set();
for (const course of courses) {
  if (!courseById.has(course.course_id)) continue;
  if (course.course_type === "academy_course") {
    if (!Number.isInteger(course.course_order)) {
      fail(`${course.course_id} must have an integer course_order.`);
    } else if (numberedOrders.has(course.course_order)) {
      fail(`Duplicate numbered course order: ${course.course_order}`);
    } else {
      numberedOrders.add(course.course_order);
    }
  }
  if (course.course_type === "academy_path_hub_group" && course.course_order !== null) {
    fail(`${course.course_id} is a path hub group and should not have a numbered course_order.`);
  }
  for (const field of ["recommended_previous_course", "recommended_next_course"]) {
    const target = course[field];
    if (target !== null && !courseById.has(target)) {
      fail(`${course.course_id}.${field} points to missing course: ${target}`);
    }
  }
  if (course.hard_app_links_enabled !== false) {
    fail(`${course.course_id} must keep hard_app_links_enabled false.`);
  }
}

const moduleOrderByCourse = new Map();
for (const module of modules) {
  if (!courseById.has(module.course_id)) {
    fail(`Module ${module.module_id} points to missing course ${module.course_id}.`);
  }
  const orderKey = `${module.course_id}:${module.module_order}`;
  if (moduleOrderByCourse.has(orderKey)) {
    fail(`Duplicate module_order ${module.module_order} inside ${module.course_id}.`);
  }
  moduleOrderByCourse.set(orderKey, module);
}

const allRegisteredSlugs = new Set();
const membershipSlugs = new Set();
const owningRowsBySlug = new Map();
const membershipOrderByCourse = new Map();

for (const row of memberships) {
  allRegisteredSlugs.add(row.lesson_slug);
  membershipSlugs.add(row.lesson_slug);
  if (!allowedMembershipTypes.has(row.membership_type)) {
    fail(`${row.lesson_slug} has invalid membership_type ${row.membership_type}.`);
  }
  if (!allowedCompletionBehaviors.has(row.completion_behavior)) {
    fail(`${row.lesson_slug} has invalid completion_behavior ${row.completion_behavior}.`);
  }
  if (!courseById.has(row.display_course_id)) {
    fail(`${row.lesson_slug} points to missing display_course_id ${row.display_course_id}.`);
  }
  if (!courseById.has(row.canonical_course_id)) {
    fail(`${row.lesson_slug} points to missing canonical_course_id ${row.canonical_course_id}.`);
  }
  if (!moduleByKey.has(`${row.display_course_id}:${row.module_id}`)) {
    fail(`${row.lesson_slug} points to missing module ${row.display_course_id}:${row.module_id}.`);
  }
  const markdownPath = lessonSlugToMarkdownPath(row.lesson_slug);
  if (markdownPath && !fs.existsSync(markdownPath)) {
    fail(`${row.lesson_slug} does not resolve to ${path.relative(root, markdownPath)}.`);
  }
  if (row.hard_app_links_enabled !== false) {
    fail(`${row.lesson_slug} must keep hard_app_links_enabled false.`);
  }
  if (row.required_for_core_completion && row.completion_behavior !== "required") {
    fail(`${row.lesson_slug} is required_for_core_completion but completion_behavior is ${row.completion_behavior}.`);
  }
  if (row.membership_type === "supporting") {
    if (row.required_for_core_completion || row.counts_toward_course_progress) {
      fail(`${row.lesson_slug} is supporting but counts toward required course progress.`);
    }
  }
  if (row.primary_visual_asset && !assetPathExists(row.primary_visual_asset)) {
    fail(`${row.lesson_slug} references missing primary_visual_asset ${row.primary_visual_asset}.`);
  }
  for (const navField of ["recommended_previous_in_context", "recommended_next_in_context"]) {
    const target = row[navField];
    if (target && !fs.existsSync(lessonSlugToMarkdownPath(target))) {
      fail(`${row.lesson_slug}.${navField} points to missing lesson ${target}.`);
    }
  }
  if (["canonical", "submodule"].includes(row.membership_type)) {
    if (!owningRowsBySlug.has(row.lesson_slug)) owningRowsBySlug.set(row.lesson_slug, []);
    owningRowsBySlug.get(row.lesson_slug).push(row);
  }
  if (row.required_for_core_completion) {
    const key = `${row.display_course_id}:${row.display_order}`;
    if (membershipOrderByCourse.has(key)) {
      fail(`Duplicate required display_order ${row.display_order} inside ${row.display_course_id}.`);
    }
    membershipOrderByCourse.set(key, row);
  }
}

for (const row of memberships) {
  if (row.membership_type === "cross_listed" || row.membership_type === "supporting") {
    const owners = owningRowsBySlug.get(row.lesson_slug) ?? [];
    if (owners.length === 0) {
      fail(`${row.lesson_slug} is ${row.membership_type} but has no canonical/submodule owner row.`);
    }
    if (!owners.some((owner) => owner.canonical_course_id === row.canonical_course_id)) {
      fail(`${row.lesson_slug} canonical owner mismatch for ${row.display_course_id}.`);
    }
  }
}

for (const [slug, owners] of owningRowsBySlug.entries()) {
  const canonicalCourseIds = new Set(owners.map((owner) => owner.canonical_course_id));
  if (canonicalCourseIds.size !== 1) {
    fail(`${slug} has multiple canonical owners: ${[...canonicalCourseIds].join(", ")}`);
  }
}

const protectedProgressSlugMap = requireUnique(
  protectedProgressSlugs,
  (slug) => slug,
  "progress-slug-baseline.protected_lesson_slugs",
);
const aliasByOldSlug = requireUnique(
  progressAliases,
  (alias) => alias.old_slug,
  "progress-slug-aliases.aliases.old_slug",
);
const activeProtectedSlugs = new Set(
  memberships
    .filter((row) => protectedLaunchCourseIds.has(row.display_course_id))
    .map((row) => row.lesson_slug),
);

for (const courseId of protectedLaunchCourseIds) {
  if (!courseById.has(courseId)) {
    fail(`progress-slug-baseline protects missing course ${courseId}.`);
  }
}

for (const alias of progressAliases) {
  if (!alias.old_slug || !alias.current_slug || !alias.reason) {
    fail("Each progress slug alias requires old_slug, current_slug, and reason.");
    continue;
  }
  lessonSlugToMarkdownPath(alias.old_slug);
  lessonSlugToMarkdownPath(alias.current_slug);
  if (alias.old_slug === alias.current_slug) {
    fail(`${alias.old_slug} aliases itself.`);
  }
  if (membershipSlugs.has(alias.old_slug)) {
    fail(`${alias.old_slug} is still an active lesson slug and should not be a progress alias old_slug.`);
  }
  if (!activeProtectedSlugs.has(alias.current_slug)) {
    fail(`${alias.old_slug} aliases to ${alias.current_slug}, but the current slug is not active in a protected launch course.`);
  }
  if (!protectedProgressSlugMap.has(alias.old_slug)) {
    fail(`${alias.old_slug} has a progress alias but is not preserved in progress-slug-baseline.json.`);
  }
  if (aliasByOldSlug.has(alias.current_slug)) {
    fail(`${alias.old_slug} aliases to ${alias.current_slug}, but chained progress aliases are not allowed.`);
  }
}

for (const slug of protectedProgressSlugs) {
  lessonSlugToMarkdownPath(slug);
  if (!activeProtectedSlugs.has(slug) && !aliasByOldSlug.has(slug)) {
    fail(`${slug} was removed from protected launch Academy progress without an alias in progress-slug-aliases.json.`);
  }
}

for (const slug of activeProtectedSlugs) {
  if (!protectedProgressSlugMap.has(slug)) {
    fail(`${slug} is an active protected launch lesson but is missing from progress-slug-baseline.json.`);
  }
}

for (const pathHub of pathHubs) {
  allRegisteredSlugs.add(pathHub.path_slug);
  const markdownPath = lessonSlugToMarkdownPath(pathHub.path_slug);
  if (markdownPath && !fs.existsSync(markdownPath)) {
    fail(`${pathHub.path_slug} does not resolve to ${path.relative(root, markdownPath)}.`);
  }
  if (pathHub.hard_app_links_enabled !== false) {
    fail(`${pathHub.path_id} must keep hard_app_links_enabled false.`);
  }
  for (const step of pathHub.steps ?? []) {
    if (!allowedPathStepTypes.has(step.step_type)) {
      fail(`${pathHub.path_id}.${step.step_id} has invalid step_type ${step.step_type}.`);
    }
    if ((step.step_type === "course" || step.step_type === "module" || step.step_type === "submodule") && !courseById.has(step.target_id)) {
      fail(`${pathHub.path_id}.${step.step_id} points to missing target_id ${step.target_id}.`);
    }
    if (step.step_type === "lesson") {
      const targetPath = lessonSlugToMarkdownPath(step.target_slug);
      if (targetPath && !fs.existsSync(targetPath)) {
        fail(`${pathHub.path_id}.${step.step_id} points to missing target_slug ${step.target_slug}.`);
      }
    }
  }
}

for (const bridge of appBridges) {
  if (bridge.scope === "course" && !courseById.has(bridge.course_id)) {
    fail(`${bridge.app_bridge_card_id} points to missing course ${bridge.course_id}.`);
  }
  if (!allowedBridgeStrengths.has(bridge.bridge_strength)) {
    fail(`${bridge.app_bridge_card_id} has invalid bridge_strength ${bridge.bridge_strength}.`);
  }
  if (!allowedBridgeSurfaces.has(bridge.primary_surface)) {
    fail(`${bridge.app_bridge_card_id} has invalid primary_surface ${bridge.primary_surface}.`);
  }
  for (const surface of bridge.secondary_surfaces ?? []) {
    if (!allowedBridgeSurfaces.has(surface)) {
      fail(`${bridge.app_bridge_card_id} has invalid secondary surface ${surface}.`);
    }
  }
  if (bridge.hard_link_enabled !== false) {
    fail(`${bridge.app_bridge_card_id} must keep hard_link_enabled false.`);
  }
  if (bridge.route_key !== null) {
    fail(`${bridge.app_bridge_card_id} must keep route_key null until app routes are stable.`);
  }
}

for (const visual of visualOverrides) {
  if (!courseById.has(visual.course_id)) {
    fail(`visual override points to missing course ${visual.course_id}.`);
  }
  if (visual.primary_visual_asset && !assetPathExists(visual.primary_visual_asset)) {
    fail(`${visual.course_id} references missing primary_visual_asset ${visual.primary_visual_asset}.`);
  }
  for (const moduleAsset of visual.module_visual_assets ?? []) {
    if (moduleAsset.asset_path && !assetPathExists(moduleAsset.asset_path)) {
      fail(`${visual.course_id} references missing module visual ${moduleAsset.asset_path}.`);
    }
  }
}

const academyMarkdownFiles = [];
function collectMarkdownFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_data") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      academyMarkdownFiles.push(fullPath);
    }
  }
}
collectMarkdownFiles(path.join(root, "academy"));

const registeredMarkdownPaths = new Set(
  [...allRegisteredSlugs]
    .map((slug) => lessonSlugToMarkdownPath(slug))
    .filter(Boolean)
    .map((file) => path.normalize(file)),
);

const unrepresentedMarkdown = academyMarkdownFiles
  .map((file) => path.normalize(file))
  .filter((file) => !registeredMarkdownPaths.has(file));

if (unrepresentedMarkdown.length > 0) {
  warn(`${unrepresentedMarkdown.length} academy markdown files are not represented in this registry. This can be expected for non-Academy-ready SEO/archive drafts.`);
}

const uniqueRegisteredSlugs = allRegisteredSlugs.size;
const requiredRows = memberships.filter((row) => row.required_for_core_completion).length;

if (errors.length > 0) {
  console.error("Academy registry validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length > 0) {
    console.warn("\\nWarnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  process.exit(1);
}

console.log("Academy registry validation passed.");
console.log(`Courses: ${courses.length}`);
console.log(`Modules: ${modules.length}`);
console.log(`Membership rows: ${memberships.length}`);
console.log(`Required membership rows: ${requiredRows}`);
console.log(`Registered lesson/path slugs: ${uniqueRegisteredSlugs}`);
console.log(`Path hubs: ${pathHubs.length}`);
console.log(`App bridge rows: ${appBridges.length}`);
console.log(`Visual override rows: ${visualOverrides.length}`);
if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}
