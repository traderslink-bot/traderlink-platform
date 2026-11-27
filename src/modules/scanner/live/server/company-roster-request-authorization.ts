import { createHash, timingSafeEqual } from "node:crypto";

export function isAuthorizedCompanyRosterRequest(request: Request, token: string): boolean {
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const expected = createHash("sha256").update("Bearer " + token).digest();
  return timingSafeEqual(supplied, expected);
}
