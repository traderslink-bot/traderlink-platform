import { redirect } from "next/navigation";

export default async function DaySessionsCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const designPreview = (await searchParams).preview === "design";
  redirect(`/trade-tracker${designPreview ? "?preview=design" : ""}`);
}
