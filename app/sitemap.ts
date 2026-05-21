import type { MetadataRoute } from "next";

import {
  getAcademyCoursePage,
  getLaunchAcademyCourseIds,
  getLaunchAcademyLessonStaticParams,
} from "@/src/lib/academy/academy-content";
import { absoluteAcademyUrl } from "@/src/lib/academy/academy-seo";

type SitemapEntry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const courseEntries = getLaunchAcademyCourseIds().flatMap<SitemapEntry>(
    (courseId) => {
      const page = getAcademyCoursePage(courseId);

      if (!page) {
        return [];
      }

      return [sitemapEntry(page.course.course_slug, "weekly", 0.9, now)];
    },
  );
  const lessonEntries = getLaunchAcademyLessonStaticParams().map(({ slug }) =>
    sitemapEntry(`/academy/${slug.join("/")}/`, "monthly", 0.75, now),
  );

  return [
    sitemapEntry("/", "weekly", 1, now),
    sitemapEntry("/academy/", "weekly", 0.95, now),
    ...courseEntries,
    ...lessonEntries,
  ];
}

function sitemapEntry(
  pathname: string,
  changeFrequency: SitemapEntry["changeFrequency"],
  priority: number,
  lastModified: Date,
): SitemapEntry {
  return {
    url: absoluteAcademyUrl(pathname),
    lastModified,
    changeFrequency,
    priority,
  };
}
