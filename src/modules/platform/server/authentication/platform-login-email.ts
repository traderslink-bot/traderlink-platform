import "server-only";
import { createHash } from "node:crypto";
export type LoginMail = {
  email: string;
  purpose: "verify" | "reset" | "changed" | "change-email" | "email-changed";
  token?: string;
  origin: string;
  deliveryId?: string;
  verificationContext?: "signup" | "add-email";
};
function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, character => entities[character]);
}

export function renderPlatformLoginMail(mail: LoginMail) {
  const url = mail.token ? new URL(`/login/${mail.purpose}`, mail.origin) : null;
  if (url) url.hash = new URLSearchParams({ token: mail.token! }).toString();
  const subject = mail.purpose === "verify" ? "Verify your TradersLink email"
    : mail.purpose === "reset" ? "Reset your TradersLink password"
    : mail.purpose === "change-email" ? "Verify your new TradersLink email"
    : mail.purpose === "email-changed" ? "Your TradersLink email changed"
    : "Your TradersLink password changed";
  const introduction = mail.purpose === "verify"
    ? mail.verificationContext === "add-email"
      ? "Please verify your email address to finish adding email sign-in to your TradersLink account."
      : "Thanks for signing up for TradersLink! Please verify your email address to activate your account and get started."
    : mail.purpose === "reset"
      ? "We received a request to reset your TradersLink password. Use the button below to choose a new password."
    : mail.purpose === "change-email"
      ? "Please verify your new email address for your TradersLink account."
    : mail.purpose === "email-changed"
      ? "Your email login address has changed. If this was not you, use another connected login method or contact support."
      : "Your password has changed and previous sessions have been signed out. If this was not you, reset your password or contact support.";
  const button = mail.purpose === "reset" ? "Reset Password" : "Verify Email Address";
  const ignore = mail.purpose === "verify"
    ? mail.verificationContext === "add-email"
      ? "If you didn’t request email sign-in for your TradersLink account, you can safely ignore this email."
      : "If you didn’t create an account with TradersLink, you can safely ignore this email."
    : mail.purpose === "reset"
      ? "If you didn’t request a password reset, you can safely ignore this email."
      : "If you didn’t request this email change, you can safely ignore this email.";
  const text = [introduction, ...(url ? [button + ": " + url.href,
    "If the button doesn't work, copy and paste this link into your browser:\n" + url.href, ignore] : []), "— TradersLink"].join("\n\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f6fa;color:#172033;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#ffffff;border-radius:8px;"><tr><td style="padding:28px;font-size:16px;line-height:1.6;">
<p style="margin:0 0 24px;">${escapeHtml(introduction).replace("TradersLink", "<strong>TradersLink</strong>")}</p>
${url ? `<p style="margin:0 0 24px;"><a href="${escapeHtml(url.href)}" style="display:inline-block;background-color:#011e56;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;">${button}</a></p>
<p style="margin:0 0 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
<p style="margin:0 0 24px;font-size:14px;word-break:break-all;"><a href="${escapeHtml(url.href)}" style="color:#011e56;">${escapeHtml(url.href)}</a></p>
<p style="margin:0 0 24px;">${escapeHtml(ignore)}</p>` : ""}
<p style="margin:0;">— TradersLink</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function deliverPlatformLoginMail(
  mail: LoginMail,
  fetcher: typeof fetch = fetch,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const apiKey = environment.RESEND_API_KEY;
  const from = environment.TRADERLINK_LOGIN_EMAIL_FROM;
  if (!apiKey || !from || /[\r\n]/.test(from)) throw new Error("Email sign-in is not configured.");
  const { subject, text, html } = renderPlatformLoginMail(mail);
  const result = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key":
        mail.deliveryId ??
        createHash("sha256")
          .update(mail.purpose + ":" + (mail.token ?? text) + ":" + mail.email)
          .digest("hex"),
    },
    body: JSON.stringify({ from, to: [mail.email], subject, text, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok)
    throw new Error("We could not send the email. Try again shortly.");
}
