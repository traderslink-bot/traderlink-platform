import { describe, expect, it } from "vitest";

import {
  getAcademyAppBridgeForLesson,
  getAcademyCourseIds,
  getAcademyCoursePage,
  getAcademyCourses,
  getAcademyLesson,
  getAcademyLessonBySegments,
  getAcademyLessonStaticParams,
  getAcademyPathHubIds,
  getAcademyPathHubPage,
  getLaunchAcademyCourseIds,
  getLaunchAcademyLessonStaticParams,
  getLaunchAcademyPathHubIds,
} from "../academy-content";

describe("academy content loader", () => {
  it("loads the ordered Academy course index without path hub pseudo-courses", () => {
    const courses = getAcademyCourses();

    expect(courses.length).toBeGreaterThanOrEqual(14);
    expect(courses[0]?.course_id).toBe("trading-foundations");
    expect(getAcademyCourseIds()).not.toContain("academy-navigation-path-hubs");
  });

  it("builds a course page from modules and lesson memberships", () => {
    const page = getAcademyCoursePage("chart-reading-market-structure");

    expect(page?.course.course_title).toBe(
      "Chart Reading And Market Structure",
    );
    expect(page?.requiredLessonCount).toBeGreaterThan(0);
    expect(page?.modules[0]?.module.module_title).toBe(
      "Chart Reading Basics And Core Levels",
    );
    expect(
      page?.modules
        .flatMap(({ lessons }) => lessons)
        .some((lesson) => lesson.lesson_slug === "/academy/support-and-resistance/"),
    ).toBe(true);
  });

  it("loads lesson markdown, course contexts, previous/next links, and app bridge data", () => {
    const lesson = getAcademyLesson("/academy/support-and-resistance/");

    expect(lesson?.title).toBe(
      "Support and Resistance: A Practical Trading Guide",
    );
    expect(lesson?.contexts[0]).toMatchObject({
      courseId: "chart-reading-market-structure",
      moduleTitle: "Chart Reading Basics And Core Levels",
    });
    expect(lesson?.previousLesson?.slug).toBe("/academy/candlestick-patterns/");
    expect(lesson?.nextLesson?.slug).toBe(
      "/academy/how-to-draw-support-and-resistance/",
    );

    const bridge = lesson ? getAcademyAppBridgeForLesson(lesson) : null;
    expect(bridge?.hard_link_enabled).toBe(false);
  });

  it("supports nested Academy lesson slugs", () => {
    const lesson = getAcademyLessonBySegments(["sec-filings", "form-8-k"]);

    expect(lesson?.slug).toBe("/academy/sec-filings/form-8-k/");
    expect(lesson?.title).toBe(
      "Form 8-K: How Traders Review Current Event Filings",
    );
  });

  it("generates static params for lessons and path hubs", () => {
    const params = getAcademyLessonStaticParams().map(({ slug }) =>
      slug.join("/"),
    );

    expect(params).toContain("support-and-resistance");
    expect(params).toContain("sec-filings/form-8-k");
    expect(params).toContain("chart-reading-path");
  });

  it("limits launch static params to the open Chart Reading course", () => {
    const params = getLaunchAcademyLessonStaticParams().map(({ slug }) =>
      slug.join("/"),
    );

    expect(getLaunchAcademyCourseIds()).toEqual([
      "chart-reading-market-structure",
    ]);
    expect(getLaunchAcademyPathHubIds()).toEqual([]);
    expect(params).toContain("support-and-resistance");
    expect(params).toContain("candlestick-patterns/doji");
    expect(params).not.toContain("sec-filings/form-8-k");
  });

  it("builds path hub pages from course and lesson steps", () => {
    expect(getAcademyPathHubIds()).toContain("chart-reading-path");

    const page = getAcademyPathHubPage("chart-reading-path");

    expect(page?.hub.path_title).toBe("Chart Reading Path");
    expect(page?.steps[0]).toMatchObject({
      type: "course",
      course: {
        course_id: "chart-reading-market-structure",
      },
    });
  });
});
