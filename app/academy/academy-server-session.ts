import { cookies } from "next/headers";

import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
  type AcademySession,
} from "@/src/lib/academy/academy-progress-store";

export async function getCurrentAcademySession(): Promise<AcademySession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACADEMY_SESSION_COOKIE)?.value;

  return await new AcademyProgressStore().getSessionByToken(token);
}
