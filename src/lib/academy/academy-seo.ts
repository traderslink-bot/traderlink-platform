import type { Metadata } from "next";

import type {
  AcademyCourse,
  AcademyLesson,
  AcademyPathHub,
} from "./academy-content";

export const TRADERSLINK_ORIGIN = "https://traderslink.pro";
export const ACADEMY_SITE_NAME = "TradersLink Academy";
export const TRADERSLINK_TWITTER_HANDLE = "@TradersLink_";
export const TRADERSLINK_DISCORD_INVITE_URL = "https://discord.gg/sTWd3KwWC";
export const TRADERSLINK_X_URL = "https://x.com/TradersLink_";

export const ACADEMY_HOME_TITLE =
  "Free Stock Market Lessons for Small Cap Traders";
export const ACADEMY_HOME_DESCRIPTION =
  "Learn how small cap stock traders read charts, candles, market structure, manage risk, and build better trading habits through structured Academy courses.";

const ACADEMY_TITLE_SUFFIX = " | TradersLink Academy";
const OG_IMAGE = "/logo-horizontal-main.png";

type AcademyMetadataInput = {
  title: string;
  description: string;
  pathname: string;
  type?: "article" | "website";
  keywords?: string[];
  noIndex?: boolean;
};

export function buildAcademyMetadata({
  title,
  description,
  pathname,
  type = "article",
  keywords,
  noIndex = false,
}: AcademyMetadataInput): Metadata {
  const canonical = normalizePathname(pathname);
  const pageTitle = formatAcademyTitle(title);
  const pageDescription = formatMetaDescription(description);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      siteName: ACADEMY_SITE_NAME,
      type,
      images: [
        {
          url: OG_IMAGE,
          alt: "TradersLink logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      site: TRADERSLINK_TWITTER_HANDLE,
      creator: TRADERSLINK_TWITTER_HANDLE,
      images: [OG_IMAGE],
    },
  };
}

export function getAcademyCourseSeoDescription(course: AcademyCourse): string {
  if (course.course_id === "trading-foundations") {
    return "Learn stock market basics for beginner traders, including trades, quotes, order types, trading plans, risk, position sizing, stops, and trade review.";
  }

  if (course.course_id === "chart-reading-market-structure") {
    return "Learn how small cap traders read stock charts, candles, support and resistance, market structure, breakouts, breakdowns, gaps, and chart patterns.";
  }

  return (
    course.course_outcome ||
    course.display_model ||
    `${course.course_title} from TradersLink Academy.`
  );
}

export function absoluteAcademyUrl(pathname: string): string {
  return new URL(normalizePathname(pathname), TRADERSLINK_ORIGIN).toString();
}

export function buildAcademyHomeJsonLd(courses: AcademyCourse[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: ACADEMY_SITE_NAME,
      url: absoluteAcademyUrl("/academy/"),
      publisher: tradersLinkOrganization(),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "TradersLink Academy courses",
      itemListElement: courses.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: course.course_title,
        url: absoluteAcademyUrl(course.course_slug),
      })),
    },
  ];
}

export function buildCourseJsonLd(course: AcademyCourse) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.course_title,
      description: formatMetaDescription(getAcademyCourseSeoDescription(course)),
      provider: tradersLinkOrganization(),
      url: absoluteAcademyUrl(course.course_slug),
    },
    buildBreadcrumbJsonLd([
      { name: "TradersLink Academy", url: "/academy/" },
      { name: course.course_title, url: course.course_slug },
    ]),
  ];
}

export function buildLessonJsonLd(lesson: AcademyLesson) {
  const primaryContext = lesson.contexts[0] ?? null;

  return [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: lesson.title,
      description: formatMetaDescription(lesson.description),
      learningResourceType: "Lesson",
      educationalLevel: "Beginner",
      provider: tradersLinkOrganization(),
      url: absoluteAcademyUrl(lesson.slug),
      isPartOf: primaryContext
        ? {
            "@type": "Course",
            name: primaryContext.courseTitle,
            url: absoluteAcademyUrl(primaryContext.courseSlug),
          }
        : {
            "@type": "Course",
            name: ACADEMY_SITE_NAME,
            url: absoluteAcademyUrl("/academy/"),
          },
    },
    buildBreadcrumbJsonLd([
      { name: "TradersLink Academy", url: "/academy/" },
      ...(primaryContext
        ? [
            {
              name: primaryContext.courseTitle,
              url: primaryContext.courseSlug,
            },
          ]
        : []),
      { name: lesson.title, url: lesson.slug },
    ]),
  ];
}

export function buildPathHubJsonLd(hub: AcademyPathHub) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: hub.path_title,
      description: formatMetaDescription(hub.path_goal),
      learningResourceType: "Learning path",
      provider: tradersLinkOrganization(),
      url: absoluteAcademyUrl(hub.path_slug),
    },
    buildBreadcrumbJsonLd([
      { name: "TradersLink Academy", url: "/academy/" },
      { name: hub.path_title, url: hub.path_slug },
    ]),
  ];
}

export function jsonLdScript(data: unknown): { __html: string } {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteAcademyUrl(item.url),
    })),
  };
}

function tradersLinkOrganization() {
  return {
    "@type": "Organization",
    name: "TradersLink",
    url: TRADERSLINK_ORIGIN,
    logo: new URL(OG_IMAGE, TRADERSLINK_ORIGIN).toString(),
  };
}

function formatAcademyTitle(title: string): string {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized.includes("TradersLink")) {
    return normalized;
  }

  return normalized.length + ACADEMY_TITLE_SUFFIX.length <= 65
    ? `${normalized}${ACADEMY_TITLE_SUFFIX}`
    : normalized;
}

function formatMetaDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= 158) {
    return normalized;
  }

  const clipped = normalized
    .slice(0, 157)
    .replace(/\s+\S*$/, "")
    .replace(/[,;:\s]+$/, "");

  return `${clipped}.`;
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}
