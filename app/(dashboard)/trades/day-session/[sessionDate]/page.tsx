import { redirect } from "next/navigation";

export default async function DaySessionCompatibilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionDate: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { sessionDate } = await params;
  const designPreview = (await searchParams).preview === "design";
  redirect(
    `/trade-tracker/${encodeURIComponent(sessionDate)}${designPreview ? "?preview=design" : ""}`,
  );
}
