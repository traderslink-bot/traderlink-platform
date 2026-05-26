import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AcademyShell } from "../../academy-shell";
import {
  getAcademyPathHubPage,
  getLaunchAcademyPathHubIds,
  isAcademyPathHubLaunchReady,
} from "@/src/lib/academy/academy-content";
import {
  buildAcademyMetadata,
  buildPathHubJsonLd,
  jsonLdScript,
} from "@/src/lib/academy/academy-seo";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLaunchAcademyPathHubIds().map((pathId) => ({ pathId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { pathId } = await params;
  const page = getAcademyPathHubPage(pathId);

  if (!page || !isAcademyPathHubLaunchReady(pathId)) {
    return buildAcademyMetadata({
      title: "Academy Path",
      description: "A TradersLink Academy learning path for structured trading education.",
      pathname: "/academy/",
      noIndex: true,
    });
  }

  return buildAcademyMetadata({
    title: page.hub.path_title,
    description: page.hub.path_goal,
    pathname: page.hub.path_slug,
  });
}

export default async function AcademyPathPage({ params }: PageProps) {
  const { pathId } = await params;
  const page = getAcademyPathHubPage(pathId);

  if (!page || !isAcademyPathHubLaunchReady(pathId)) {
    notFound();
  }
  const pathJsonLd = buildPathHubJsonLd(page.hub);

  return (
    <AcademyShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(pathJsonLd)}
      />
      <div className="academy-container-narrow">
        <section className="academy-hero">
          <p className="academy-eyebrow">Guided Path</p>
          <h1 className="academy-title-sm">{page.hub.path_title}</h1>
          <p className="academy-lede">{page.hub.path_goal}</p>
          <p className="academy-body-copy">{page.hub.recommended_for}</p>
        </section>

        <section className="academy-path-list">
          {page.steps.map((item) => {
            const href =
              item.type === "course"
                ? item.course.course_slug
                : item.lesson.slug;
            const title =
              item.type === "course"
                ? item.course.course_title
                : item.lesson.title;
            const label = item.type === "course" ? "Course" : "Lesson";

            return (
              <Link
                key={item.step.step_id}
                href={href}
                className="academy-path-card"
              >
                <span className="academy-path-number">
                  {item.step.step_order}
                </span>
                <span>
                  <span className="academy-path-meta">{label}</span>
                  <span className="academy-path-title">{title}</span>
                </span>
                <span className="academy-path-action">Open</span>
              </Link>
            );
          })}
        </section>
      </div>
    </AcademyShell>
  );
}
