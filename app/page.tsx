import { redirect } from "next/navigation";

export default function Home() {
  redirect("/api/auth/discord/login?returnTo=%2Fworkspace");
}
