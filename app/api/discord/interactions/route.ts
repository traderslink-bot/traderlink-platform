import { after } from "next/server";
import { notificationRoleConfiguration, notificationRoleSelectorEnabled } from "@/src/modules/platform/server/discord-notification-roles/configuration";
import { dispatchNotificationRoleInteraction } from "@/src/modules/platform/server/discord-notification-roles/interaction-service";
import { readDiscordInteractionBody, validDiscordInteractionSignature } from "@/src/modules/platform/server/discord-notification-roles/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  // Deployment alone never activates role changes. No existing bot configuration is modified here.
  if (!notificationRoleSelectorEnabled()) return Response.json({ error: "Not enabled" }, { status: 503, headers });
  const config = notificationRoleConfiguration();
  if (!config) return Response.json({ error: "Not configured" }, { status: 503, headers });
  const body = await readDiscordInteractionBody(request);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400, headers });
  if (!validDiscordInteractionSignature(request, body, config.publicKey)) {
    return Response.json({ error: "Invalid signature" }, { status: 401, headers });
  }
  let payload: unknown;
  try { payload = JSON.parse(body.toString("utf8")); }
  catch { return Response.json({ error: "Invalid request" }, { status: 400, headers }); }
  const dispatched = dispatchNotificationRoleInteraction(payload, config);
  // Signed actions are ACKed immediately; role reads/writes happen only after the response finishes.
  if (dispatched.work) after(dispatched.work);
  return Response.json(dispatched.response, { headers });
}
