import type { MetadataRoute } from "next";

import {
  getAcademyCoursePage,
  getLaunchAcademyCourseIds,
  getLaunchAcademyLessonStaticParams,
} from "@/src/lib/academy/academy-content";
import { absoluteAcademyUrl } from "@/src/lib/academy/academy-seo";
import { PUBLIC_HELP_COLLECTIONS } from "@/src/modules/help/public-help-content";

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
  const helpEntries = PUBLIC_HELP_COLLECTIONS.flatMap<SitemapEntry>((collection) => [
    sitemapEntry(collection.href, "monthly", 0.7, now),
    ...collection.guides.map((guide) =>
      sitemapEntry(`${collection.href}/${guide.slug}`, "monthly", 0.65, now),
    ),
  ]);

  return [
    sitemapEntry("/", "weekly", 1, now),
    sitemapEntry("/academy/", "weekly", 0.95, now),
    sitemapEntry("/privacy", "yearly", 0.3, now),
    sitemapEntry("/terms", "yearly", 0.3, now),
    ...courseEntries,
    ...lessonEntries,
    sitemapEntry("/help", "weekly", 0.8, now),
    ...helpEntries,
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
