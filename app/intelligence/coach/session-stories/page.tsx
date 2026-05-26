import type { Metadata } from "next";
import CoachPage from "../page";

export const metadata: Metadata = {
  title: "Coach Session Stories | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function CoachSessionStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return CoachPage({
    searchParams: Promise.resolve({
      ...query,
      view: "session_stories",
    }),
  });
}
