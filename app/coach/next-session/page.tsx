import type { Metadata } from "next";
import CoachPage from "../page";

export const metadata: Metadata = {
  title: "Coach Next Session | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function CoachNextSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return CoachPage({
    searchParams: Promise.resolve({
      ...query,
      view: "next_session",
    }),
  });
}
