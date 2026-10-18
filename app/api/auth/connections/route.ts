import { NextResponse, type NextRequest } from "next/server";
import {
  loginOperation,
  loginSession,
  readLoginBody,
  throttleLogin,
} from "@/src/modules/platform/server/authentication/platform-login-http";
import {
  PlatformLoginError,
  type LoginProvider,
} from "@/src/modules/platform/server/authentication/platform-login-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await readLoginBody(request);
    const provider = body.provider as LoginProvider;
    if (!["google", "discord", "email"].includes(provider))
      throw new PlatformLoginError("invalid");
    throttleLogin(request, "connections");
    if (body.action === "unlink") {
      loginOperation((s) => s.unlink(loginSession(request), provider));
      return NextResponse.json({ redirect: "/account/login" });
    }
    if (body.action !== "connect" || provider === "email")
      throw new PlatformLoginError("invalid");
    const intent = loginOperation((s) =>
      s.createLinkIntent(loginSession(request), provider),
    );
    const discordReturnTo = body.returnTo === "/workspace" ? "/workspace" : "/account/login";
    const response = NextResponse.json({
      redirect:
        provider === "google"
          ? "/api/auth/google/login?connect=1&returnTo=/account/login"
          : `/api/auth/discord/login?connect=1&prompt=consent&returnTo=${discordReturnTo}`,
    });
    for (const [name, value] of [
      ["tl_provider_link", intent],
      ["tl_provider_link_method", provider],
    ])
      response.cookies.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof PlatformLoginError
            ? error.message
            : "Could not update your login methods.",
      },
      { status: 400 },
    );
  }
}
