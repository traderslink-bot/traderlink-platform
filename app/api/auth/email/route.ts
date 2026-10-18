import { NextResponse, type NextRequest } from "next/server";
import {
  hashPlatformPassword,
  verifyPlatformPassword,
} from "@/src/modules/platform/server/authentication/platform-password";
import {
  loginOperation,
  loginReturnTo,
  loginSession,
  readLoginBody,
  throttleLogin,
} from "@/src/modules/platform/server/authentication/platform-login-http";
import {
  normalizeLoginEmail,
  PlatformLoginError,
} from "@/src/modules/platform/server/authentication/platform-login-service";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { setPlatformAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import {
  TRADERLINK_PLATFORM_SESSION_COOKIE,
  TRADERLINK_PLATFORM_SESSION_TTL_MS,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { resolvePlatformSessionClientLabel } from "@/src/modules/platform/server/authentication/platform-session-client-label";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const generic =
  "Check your email for a password reset link.";
let dummyHash: Promise<string> | undefined;
export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const genericResponse = async (confirmationEmail?: string) => {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 250 - (performance.now() - startedAt))),
    );
    return NextResponse.json(confirmationEmail ? {
      message: `We sent a confirmation link to ${confirmationEmail}. Please click the link in that email to verify your account.`,
      confirmationEmail,
    } : { message: generic });
  };
  try {
    const body = await readLoginBody(request);
    const action = String(body.action ?? "");
    if (
      ![
        "signup",
        "login",
        "forgot",
        "verify",
        "reset",
        "link-email",
        "resend",
        "change-email",
        "confirm-email-change",
      ].includes(action)
    )
      throw new PlatformLoginError("invalid");
    const email = ["verify", "reset", "confirm-email-change"].includes(action)
      ? ""
      : normalizeLoginEmail(body.email);
    throttleLogin(request, action, email);
    const origin = resolvePlatformPublicOrigin(request);
    if (action === "change-email") {
      loginOperation(
        (s) => s.requestEmailChange(loginSession(request), email),
        origin,
      );
      return NextResponse.json({
        message: "Check your new email address to confirm the change.",
      });
    }
    if (action === "confirm-email-change") {
      const result = loginOperation(
        (s) => s.changeEmail(String(body.token ?? ""), loginSession(request)),
        origin,
      );
      const response = NextResponse.json({
        redirect: "/account/login?emailChanged=1",
      });
      setPlatformAuthCookie(
        response,
        request,
        TRADERLINK_PLATFORM_SESSION_COOKIE,
        result.signed.token,
        TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000,
      );
      return response;
    }
    if (action === "resend") {
      const candidate = loginOperation((s) => s.credential(email));
      dummyHash ??= hashPlatformPassword(
        "synthetic-unknown-user-password-padding",
      );
      const valid = await verifyPlatformPassword(
        candidate?.password_hash ?? (await dummyHash),
        body.password,
      );
      if (candidate && valid) {
        loginOperation(
          (s) =>
            s.resendVerification(
              email,
              candidate.password_hash,
              loginSession(request),
            ),
          origin,
        );
      }
      return genericResponse(email);
    }
    if (action === "signup" || action === "link-email") {
      if (action === "link-email") {
        loginOperation((s) => s.assertEmailLinkAvailable(loginSession(request), email));
        const existing = loginOperation((s) => s.credential(email));
        if (
          existing?.verified_at_utc &&
          (await verifyPlatformPassword(existing.password_hash, body.password))
        ) {
          const signed = loginOperation((s) =>
            s.reconnectEmail(
              loginSession(request),
              email,
              existing.password_hash,
            ),
          );
          const response = NextResponse.json({
            redirect: "/account/login?connected=email",
          });
          setPlatformAuthCookie(
            response,
            request,
            TRADERLINK_PLATFORM_SESSION_COOKIE,
            signed.token,
            TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000,
          );
          return response;
        }
      }
      if (
        !process.env.RESEND_API_KEY ||
        !process.env.TRADERLINK_LOGIN_EMAIL_FROM
      )
        throw new Error("Email sign-in is not configured.");
      // A repeated submission must renew pending verification rather than
      // silently reporting success without queuing another message.
      const pending = loginOperation((s) => s.credential(email));
      if (pending && !pending.verified_at_utc) {
        if (await verifyPlatformPassword(pending.password_hash, body.password)) {
          loginOperation(
            (s) => s.resendVerification(
              email,
              pending.password_hash,
              action === "link-email" ? loginSession(request) : null,
            ),
            origin,
          );
        }
        return genericResponse(email);
      }
      const passwordHash = await hashPlatformPassword(
        String(body.password ?? ""),
      );
      loginOperation(
        (s) =>
          s.signup({
            email,
            passwordHash,
            displayName: String(body.name ?? "Trader"),
            currentSession:
              action === "link-email" ? loginSession(request) : undefined,
          }),
        origin,
      );
      return genericResponse(email);
    }
    if (action === "login") {
      const candidate = loginOperation((s) => s.credential(email));
      dummyHash ??= hashPlatformPassword(
        "synthetic-unknown-user-password-padding",
      );
      const valid = await verifyPlatformPassword(
        candidate?.password_hash ?? (await dummyHash),
        body.password,
      );
      if (!valid || !candidate) throw new PlatformLoginError("invalid");
      if (!candidate.verified_at_utc) {
        return NextResponse.json({ error: "Please verify your email before signing in. Open the newest confirmation email or select Resend verification email." }, { status: 400 });
      }
      const signed = loginOperation((s) =>
        s.signInEmail(
          email,
          candidate.password_hash,
          resolvePlatformSessionClientLabel(request.headers.get("user-agent")),
          loginSession(request),
        ),
      );
      const response = NextResponse.json({
        redirect: loginReturnTo(body.returnTo),
      });
      setPlatformAuthCookie(
        response,
        request,
        TRADERLINK_PLATFORM_SESSION_COOKIE,
        signed.token,
        TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000,
      );
      return response;
    }
    if (action === "forgot") {
      loginOperation((s) => s.requestReset(email), origin);
      return genericResponse();
    }
    const token = String(body.token ?? "");
    if (action === "verify") {
      try {
        loginOperation((s) => s.verifyEmail(token));
      } catch (error) {
        if (error instanceof PlatformLoginError && error.code === "invalid") {
          return NextResponse.json({ error: "This verification link is invalid or expired. Request a new verification email and use the newest link." }, { status: 400 });
        }
        throw error;
      }
      return NextResponse.json({
        message: "Email verified. You can now sign in.",
        redirect: "/login?verified=1",
      });
    }
    const passwordHash = await hashPlatformPassword(
      String(body.password ?? ""),
    );
    loginOperation((s) => s.resetPassword(token, passwordHash), origin);
    return NextResponse.json({
      message: "Password changed. Sign in with your new password.",
      redirect: "/login?reset=1",
    });
  } catch (error) {
    const message =
      error instanceof PlatformLoginError
        ? error.message
        : error instanceof SyntaxError
          ? "The request is invalid."
          : error instanceof Error &&
              /^(Use a password|Email sign-in|Authentication is busy)/.test(
                error.message,
              )
            ? error.message
            : "We couldn't complete this request. Try again shortly.";
    return NextResponse.json(
      { error: message },
      {
        status:
          error instanceof PlatformLoginError &&
          (error.code === "email_change_sign_in" || error.code === "email_change_account")
            ? 401
            : error instanceof PlatformLoginError && error.code === "throttled"
            ? 429
            : 400,
      },
    );
  }
}
