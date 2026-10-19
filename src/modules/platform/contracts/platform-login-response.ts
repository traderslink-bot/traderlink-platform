/** Read authentication responses without exposing gateway HTML or JSON parser errors. */
export async function readLoginResponse(response: Pick<Response, "json">): Promise<{
  error: string; message: string; redirect: string; confirmationEmail: string;
}> {
  const unavailable = "The sign-in service did not respond. Please try again shortly.";
  let value: unknown;
  try { value = await response.json(); } catch { throw new Error(unavailable); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(unavailable);
  const body = value as Record<string, unknown>;
  const error = typeof body.error === "string" ? body.error : "";
  const message = typeof body.message === "string" ? body.message : "";
  const redirect = typeof body.redirect === "string" ? body.redirect : "";
  if (!error && !message && !redirect) throw new Error(unavailable);
  const confirmationEmail = typeof body.confirmationEmail === "string" ? body.confirmationEmail : "";
  return { error, message, redirect, confirmationEmail };
}
