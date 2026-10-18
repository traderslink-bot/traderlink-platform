import type { LoginMail } from "./platform-login-email";
import type { LoginMethodDetails } from "../../contracts/platform-login-method-details";
import { createHash, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";
import { readProtectedInitialOwnerDiscordSubject } from "./platform-discord-configuration";
import { provisionVerifiedPlatformIdentity } from "./platform-identity-provisioning";
import {
  PlatformSessionRepository,
  type ResolvedPlatformSession,
} from "./platform-session-repository";
import { PlatformSessionService } from "./platform-session-service";

export type LoginProvider = "google" | "discord" | "email";
export class PlatformLoginError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "conflict"
      | "last_method"
      | "email_change_sign_in"
      | "email_change_account"
      | "email_in_use"
      | "throttled",
  ) {
    super(
      {
        invalid: "Sign-in details or link are invalid or expired.",
        conflict:
          "Sign in with your existing method, then connect this method in Account.",
        last_method: "Keep at least one usable login method connected.",
        email_change_sign_in: "Sign in to the account that requested this email change in this browser, then return here and verify your new email. Your link has not been used.",
        email_change_account: "This browser is signed in to a different account. Sign in to the account that requested this email change, then return here and verify your new email. Your link has not been used.",
        email_in_use: "This email address is already connected to another account. Use a different email address.",
        throttled: "Too many attempts. Try again later.",
      }[code],
    );
  }
}
export function normalizeLoginEmail(value: unknown): string {
  if (typeof value !== "string") throw new PlatformLoginError("invalid");
  const email = value.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@\u0000-\u001f]+@[^\s@\u0000-\u001f]+\.[^\s@\u0000-\u001f]+$/u.test(
      email,
    )
  )
    throw new PlatformLoginError("invalid");
  return email;
}
export const loginTokenDigest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export type LoginCredential = {
  credential_id: string;
  user_id: string | null;
  email_normalized: string;
  password_hash: string;
  display_name: string;
  verified_at_utc: string | null;
};
type LoginToken = {
  purpose: string;
  credential_id: string | null;
  user_id: string | null;
  session_id: string | null;
  provider: LoginProvider | null;
  pending_email: string | null;
  expires_at_utc: string;
  consumed_at_utc: string | null;
};

/** Pure server services; provider/password proof and email delivery happen outside DB locks. */
export class PlatformLoginService {
  constructor(
    private readonly db: Database.Database,
    private readonly options: {
      now?: () => Date;
      createToken?: () => string;
      usableProviders?: readonly LoginProvider[];
      queueMail?: (mail: Omit<LoginMail, "origin">) => void;
    } = {},
  ) {}
  private now() {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
  private session(token: string | null) {
    return new PlatformSessionService(new PlatformSessionRepository(this.db), {
      now: this.options.now,
    }).resolve(token);
  }
  private authenticated(token: string | null): ResolvedPlatformSession {
    const session = this.session(token);
    if (!session) throw new PlatformLoginError("invalid");
    return session;
  }
  private audit(
    userId: string,
    provider: LoginProvider,
    action: "link" | "unlink" | "reconnect" | "reset" | "change_email",
  ) {
    this.db
      .prepare("INSERT INTO platform_login_identity_events VALUES (?,?,?,?,?)")
      .run(createCanonicalUuidV4(), userId, provider, action, this.now());
  }
  throttle(bucket: string, maximum = 10) {
    if (!/^[a-f0-9]{64}$/.test(bucket)) throw new PlatformLoginError("invalid");
    this.db
      .transaction(() => {
        const row = this.db
          .prepare(
            "SELECT * FROM platform_login_throttles WHERE bucket_sha256=?",
          )
          .get(bucket) as
          | { window_start_utc: string; attempts: number }
          | undefined;
        const timestamp = this.now();
        if (
          !row ||
          Date.parse(timestamp) - Date.parse(row.window_start_utc) >= 900000
        ) {
          this.db
            .prepare(
              "INSERT INTO platform_login_throttles VALUES (?,?,1) ON CONFLICT(bucket_sha256) DO UPDATE SET window_start_utc=excluded.window_start_utc,attempts=1",
            )
            .run(bucket, timestamp);
        } else {
          if (row.attempts >= maximum)
            throw new PlatformLoginError("throttled");
          this.db
            .prepare(
              "UPDATE platform_login_throttles SET attempts=attempts+1 WHERE bucket_sha256=?",
            )
            .run(bucket);
        }
        // Bound persistent buckets without touching authentication or member records.
        this.db
          .prepare(
            "DELETE FROM platform_login_throttles WHERE window_start_utc<?",
          )
          .run(new Date(Date.parse(timestamp) - 86400000).toISOString());
      })
      .immediate();
  }
  private token(
    purpose: string,
    credentialId: string | null,
    userId: string | null,
    sessionId: string | null,
    provider: LoginProvider | null,
    ttl: number,
    pendingEmail: string | null = null,
  ) {
    const raw =
      this.options.createToken?.() ?? randomBytes(32).toString("base64url");
    const now = this.now();
    this.db
      .prepare(
        "INSERT INTO platform_login_tokens VALUES (?,?,?,?,?,?,?,?,?,NULL)",
      )
      .run(
        loginTokenDigest(raw),
        purpose,
        credentialId,
        userId,
        sessionId,
        provider,
        pendingEmail,
        now,
        new Date(Date.parse(now) + ttl).toISOString(),
      );
    return raw;
  }
  private readToken(raw: string, purpose: string): LoginToken {
    if (!/^[A-Za-z0-9_-]{43}$/.test(raw))
      throw new PlatformLoginError("invalid");
    const row = this.db
      .prepare("SELECT * FROM platform_login_tokens WHERE token_sha256=?")
      .get(loginTokenDigest(raw)) as LoginToken | undefined;
    if (
      !row ||
      row.purpose !== purpose ||
      row.consumed_at_utc ||
      row.expires_at_utc <= this.now()
    )
      throw new PlatformLoginError("invalid");
    return row;
  }
  private consume(raw: string) {
    if (
      this.db
        .prepare(
          "UPDATE platform_login_tokens SET consumed_at_utc=? WHERE token_sha256=? AND consumed_at_utc IS NULL AND expires_at_utc>?",
        )
        .run(this.now(), loginTokenDigest(raw), this.now()).changes !== 1
    )
      throw new PlatformLoginError("invalid");
  }
  credential(email: string): LoginCredential | null {
    return (
      (this.db
        .prepare(
          "SELECT * FROM platform_login_credentials WHERE email_normalized=?",
        )
        .get(normalizeLoginEmail(email)) as LoginCredential | undefined) ?? null
    );
  }
  credentialForToken(raw: string, purpose: "verify_email" | "reset_password") {
    const row = this.readToken(raw, purpose);
    return (
      (this.db
        .prepare(
          "SELECT * FROM platform_login_credentials WHERE credential_id=?",
        )
        .get(row.credential_id) as LoginCredential | undefined) ?? null
    );
  }
  signup(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    currentSession?: string | null;
  }) {
    const email = normalizeLoginEmail(input.email);
    if (!input.passwordHash.startsWith("$argon2id$"))
      throw new PlatformLoginError("invalid");
    return this.db
      .transaction(() => {
        const current =
          input.currentSession !== undefined
            ? this.authenticated(input.currentSession ?? null)
            : null;
        const displayName = (current ? current.displayName : input.displayName).normalize("NFKC").trim();
        if (!displayName || displayName.length > 120 || /[\u0000-\u001f\u007f]/u.test(displayName))
          throw new PlatformLoginError("invalid");
        const address = this.db
          .prepare(
            "SELECT user_id FROM platform_login_verified_emails WHERE email_normalized=?",
          )
          .get(email) as { user_id: string } | undefined;
        const existingCredential = this.credential(email);
        if (current && (
          (existingCredential && existingCredential.user_id !== current.userId) ||
          (address && address.user_id !== current.userId)
        ))
          throw new PlatformLoginError("email_in_use");
        if (
          existingCredential ||
          (address && address.user_id !== current?.userId)
        )
          return null;
        if (
          current &&
          this.db
            .prepare(
              "SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='email' AND status='active'",
            )
            .get(current.userId)
        )
          throw new PlatformLoginError("conflict");
        const id = createCanonicalUuidV4();
        this.db
          .prepare(
            "INSERT INTO platform_login_credentials VALUES (?,?,?,?,?,NULL,?,?)",
          )
          .run(
            id,
            current?.userId ?? null,
            email,
            input.passwordHash,
            displayName,
            this.now(),
            this.now(),
          );
        const raw = this.token(
          "verify_email",
          id,
          current?.userId ?? null,
          current?.sessionId ?? null,
          "email",
          86400000,
        );
        this.options.queueMail?.({ email, purpose: "verify", token: raw, verificationContext: current ? "add-email" : "signup" });
        return raw;
      })
      .immediate();
  }
  resendVerification(
    email: string,
    expectedHash: string,
    currentSession: string | null = null,
  ) {
    return this.db
      .transaction(() => {
        const credential = this.credential(email);
        if (
          !credential ||
          credential.verified_at_utc ||
          credential.password_hash !== expectedHash
        )
          return null;
        const current = credential.user_id ? this.authenticated(currentSession) : null;
        if (credential.user_id && current?.userId !== credential.user_id)
          throw new PlatformLoginError("invalid");
        this.db
          .prepare(
            "UPDATE platform_login_tokens SET consumed_at_utc=? WHERE credential_id=? AND purpose='verify_email' AND consumed_at_utc IS NULL",
          )
          .run(this.now(), credential.credential_id);
        const raw = this.token(
          "verify_email",
          credential.credential_id,
          credential.user_id,
          current?.sessionId ?? null,
          "email",
          86400000,
        );
        this.options.queueMail?.({
          email: credential.email_normalized,
          purpose: "verify",
          token: raw,
          verificationContext: credential.user_id ? "add-email" : "signup",
        });
        return raw;
      })
      .immediate();
  }
  verifyEmail(raw: string) {
    return this.db
      .transaction(() => {
        const token = this.readToken(raw, "verify_email");
        const credential = this.credentialForToken(raw, "verify_email");
        if (
          !credential ||
          credential.verified_at_utc ||
          credential.user_id !== token.user_id
        )
          throw new PlatformLoginError("invalid");
        let userId: string;
        if (token.user_id) {
          // The single-use email proof can only activate its issuing account.
          // It neither depends on the browser session nor signs that browser in.
          userId = token.user_id;
          this.linkIdentity(userId, "email", credential.credential_id);
        } else {
          userId = provisionVerifiedPlatformIdentity(this.db, {
            authProvider: "email",
            authSubject: credential.credential_id,
            displayName: credential.display_name,
            timestamp: this.now(),
          }).userId;
        }
        this.claimEmail(userId, credential.email_normalized);
        this.db
          .prepare(
            "UPDATE platform_login_credentials SET user_id=?,verified_at_utc=?,updated_at_utc=? WHERE credential_id=?",
          )
          .run(userId, this.now(), this.now(), credential.credential_id);
        this.ensureJournal(userId);
        this.consume(raw);
        return userId;
      })
      .immediate();
  }
  private claimEmail(userId: string, email: string) {
    const address = this.db
      .prepare(
        "SELECT user_id FROM platform_login_verified_emails WHERE email_normalized=?",
      )
      .get(email) as { user_id: string } | undefined;
    if (address && address.user_id !== userId)
      throw new PlatformLoginError("conflict");
    this.db
      .prepare(
        "INSERT INTO platform_login_verified_emails VALUES (?,?,?) ON CONFLICT(email_normalized) DO NOTHING",
      )
      .run(email, userId, this.now());
  }
  private ensureJournal(userId: string) {
    const row = this.db
      .prepare(
        "SELECT workspace_id FROM platform_workspace_memberships WHERE user_id=? AND status='active'",
      )
      .all(userId) as { workspace_id: string }[];
    if (row.length !== 1) throw new PlatformLoginError("invalid");
    const accounts = new JournalAccountRepository(this.db);
    if (accounts.listActiveAccounts(row[0].workspace_id).length === 0)
      accounts.createAccount({
        accountId: createCanonicalUuidV4(),
        workspaceId: row[0].workspace_id,
        displayName: "Primary Journal",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
        status: "active",
        createdByUserId: userId,
        createdAtUtc: this.now(),
        updatedAtUtc: this.now(),
      });
  }
  signInEmail(
    email: string,
    expectedHash: string,
    clientLabel: string | null = null,
    currentSession: string | null = null,
  ) {
    return this.db
      .transaction(() => {
        const credential = this.credential(email);
        if (
          !credential?.verified_at_utc ||
          !credential.user_id ||
          credential.password_hash !== expectedHash
        )
          throw new PlatformLoginError("invalid");
        if (
          !this.db
            .prepare(
              "SELECT 1 FROM platform_users WHERE user_id=? AND status='active'",
            )
            .get(credential.user_id)
        )
          throw new PlatformLoginError("invalid");
        new PlatformAuthenticationRepository(this.db).markAuthenticated({
          authProvider: "email",
          authSubject: credential.credential_id,
          timestamp: this.now(),
        });
        const signed = this.createSession(
          credential.user_id,
          "email",
          credential.credential_id,
          clientLabel,
        );
        this.endSession(currentSession);
        return signed;
      })
      .immediate();
  }
  private createSession(
    userId: string,
    provider: LoginProvider,
    subject: string,
    label: string | null,
  ) {
    this.ensureJournal(userId);
    return new PlatformSessionService(new PlatformSessionRepository(this.db), {
      now: this.options.now,
    }).createForIdentity({
      userId,
      authProvider: provider,
      authSubject: subject,
      clientLabel: label,
    });
  }
  requestReset(email: string) {
    return this.db
      .transaction(() => {
        const credential = this.credential(email);
        if (!credential) return null;
        if (
          credential.verified_at_utc &&
          new PlatformAuthenticationRepository(this.db).findActiveIdentity(
            "email", credential.credential_id,
          )?.userId !== credential.user_id
        )
          return null;
        const raw = this.token(
          "reset_password",
          credential.credential_id,
          credential.user_id,
          null,
          "email",
          1800000,
        );
        this.options.queueMail?.({
          email: credential.email_normalized,
          purpose: "reset",
          token: raw,
        });
        return raw;
      })
      .immediate();
  }
  resetPassword(raw: string, passwordHash: string) {
    if (!passwordHash.startsWith("$argon2id$"))
      throw new PlatformLoginError("invalid");
    this.db
      .transaction(() => {
        const token = this.readToken(raw, "reset_password");
        const credential = this.credentialForToken(raw, "reset_password");
        if (!credential || token.user_id !== credential.user_id)
          throw new PlatformLoginError("invalid");
        if (
          credential.verified_at_utc &&
          new PlatformAuthenticationRepository(this.db).findActiveIdentity(
            "email", credential.credential_id,
          )?.userId !== credential.user_id
        )
          throw new PlatformLoginError("invalid");
        if (!credential.verified_at_utc) {
          // Mailbox recovery of an unverified signup must not attach a password
          // to an existing OAuth account without recent proof of that account.
          if (credential.user_id) throw new PlatformLoginError("invalid");
          const provisioned = provisionVerifiedPlatformIdentity(this.db, {
            authProvider: "email",
            authSubject: credential.credential_id,
            displayName: credential.display_name,
            timestamp: this.now(),
          });
          credential.user_id = provisioned.userId;
          this.claimEmail(provisioned.userId, credential.email_normalized);
          this.ensureJournal(provisioned.userId);
          this.db
            .prepare(
              "UPDATE platform_login_credentials SET user_id=?,verified_at_utc=? WHERE credential_id=?",
            )
            .run(provisioned.userId, this.now(), credential.credential_id);
        }
        if (!credential.user_id) throw new PlatformLoginError("invalid");
        this.consume(raw);
        this.db
          .prepare(
            "UPDATE platform_login_credentials SET password_hash=?,updated_at_utc=? WHERE credential_id=?",
          )
          .run(passwordHash, this.now(), credential.credential_id);
        this.db
          .prepare(
            "UPDATE platform_login_tokens SET consumed_at_utc=? WHERE credential_id=? AND consumed_at_utc IS NULL",
          )
          .run(this.now(), credential.credential_id);
        new PlatformSessionRepository(this.db).revokeActiveForUser({
          userId: credential.user_id,
          timestamp: this.now(),
        });
        this.audit(credential.user_id, "email", "reset");
        this.options.queueMail?.({
          email: credential.email_normalized,
          purpose: "changed",
        });
      })
      .immediate();
  }
  requestEmailChange(currentSession: string | null, email: string) {
    return this.db
      .transaction(() => {
        const current = this.authenticated(currentSession);
        const credential = this.db
          .prepare(
            "SELECT * FROM platform_login_credentials WHERE user_id=? AND verified_at_utc IS NOT NULL",
          )
          .get(current.userId) as LoginCredential | undefined;
        if (!credential) throw new PlatformLoginError("invalid");
        const next = normalizeLoginEmail(email);
        if (
          this.credential(next) ||
          this.db
            .prepare(
              "SELECT 1 FROM platform_login_verified_emails WHERE email_normalized=? AND user_id<>?",
            )
            .get(next, current.userId)
        )
          throw new PlatformLoginError("conflict");
        this.db
          .prepare(
            "UPDATE platform_login_tokens SET consumed_at_utc=? WHERE credential_id=? AND purpose='change_email' AND consumed_at_utc IS NULL",
          )
          .run(this.now(), credential.credential_id);
        const raw = this.token(
          "change_email",
          credential.credential_id,
          current.userId,
          current.sessionId,
          "email",
          1800000,
          next,
        );
        this.options.queueMail?.({
          email: next,
          purpose: "change-email",
          token: raw,
        });
        return { token: raw, oldEmail: credential.email_normalized };
      })
      .immediate();
  }
  changeEmail(raw: string, currentSession: string | null) {
    return this.db
      .transaction(() => {
        const token = this.readToken(raw, "change_email");
        const current = this.session(currentSession);
        if (!current) throw new PlatformLoginError("email_change_sign_in");
        if (token.user_id !== current.userId)
          throw new PlatformLoginError("email_change_account");
        if (!token.pending_email)
          throw new PlatformLoginError("invalid");
        const credential = this.db
          .prepare(
            "SELECT * FROM platform_login_credentials WHERE credential_id=? AND user_id=? AND verified_at_utc IS NOT NULL",
          )
          .get(token.credential_id, current.userId) as
          | LoginCredential
          | undefined;
        if (!credential || this.credential(token.pending_email))
          throw new PlatformLoginError("conflict");
        this.claimEmail(current.userId, token.pending_email);
        this.consume(raw);
        this.db
          .prepare(
            "UPDATE platform_login_credentials SET email_normalized=?,updated_at_utc=? WHERE credential_id=?",
          )
          .run(token.pending_email, this.now(), credential.credential_id);
        this.db
          .prepare(
            "DELETE FROM platform_login_verified_emails WHERE email_normalized=? AND user_id=?",
          )
          .run(credential.email_normalized, current.userId);
        this.db
          .prepare(
            "UPDATE platform_login_tokens SET consumed_at_utc=? WHERE credential_id=? AND consumed_at_utc IS NULL",
          )
          .run(this.now(), credential.credential_id);
        new PlatformSessionRepository(this.db).revokeActiveForUser({
          userId: current.userId,
          timestamp: this.now(),
        });
        this.audit(current.userId, "email", "change_email");
        this.options.queueMail?.({
          email: credential.email_normalized,
          purpose: "email-changed",
        });
        this.options.queueMail?.({
          email: token.pending_email,
          purpose: "email-changed",
        });
        const signed = this.createSession(
          current.userId,
          "email",
          credential.credential_id,
          null,
        );
        return {
          signed,
          oldEmail: credential.email_normalized,
          newEmail: token.pending_email,
        };
      })
      .immediate();
  }
  assertEmailLinkAvailable(currentSession: string | null, email: string): void {
    const current = this.authenticated(currentSession);
    const normalized = normalizeLoginEmail(email);
    const credential = this.credential(normalized);
    const verified = this.db.prepare(
      "SELECT user_id FROM platform_login_verified_emails WHERE email_normalized=?",
    ).get(normalized) as { user_id: string } | undefined;
    if ((credential && credential.user_id !== current.userId) ||
        (verified && verified.user_id !== current.userId))
      throw new PlatformLoginError("email_in_use");
  }
  reconnectEmail(
    currentSession: string | null,
    email: string,
    expectedHash: string,
  ) {
    return this.db
      .transaction(() => {
        const current = this.authenticated(currentSession);
        const credential = this.credential(email);
        if (credential && credential.user_id !== current.userId)
          throw new PlatformLoginError("email_in_use");
        if (
          !credential?.verified_at_utc ||
          credential.user_id !== current.userId ||
          credential.password_hash !== expectedHash
        )
          throw new PlatformLoginError("invalid");
        this.linkIdentity(current.userId, "email", credential.credential_id);
        const result = this.createSession(
          current.userId,
          "email",
          credential.credential_id,
          null,
        );
        new PlatformSessionService(new PlatformSessionRepository(this.db), {
          now: this.options.now,
        }).revoke(currentSession);
        return result;
      })
      .immediate();
  }
  createLinkIntent(currentSession: string | null, provider: LoginProvider) {
    return this.db
      .transaction(() => {
        const session = this.authenticated(currentSession);
        return this.token(
          "link_provider",
          null,
          session.userId,
          session.sessionId,
          provider,
          600000,
        );
      })
      .immediate();
  }
  private linkIdentity(
    userId: string,
    provider: LoginProvider,
    subject: string,
  ) {
    if (
      !this.db
        .prepare(
          "SELECT 1 FROM platform_users WHERE user_id=? AND status='active'",
        )
        .get(userId)
    )
      throw new PlatformLoginError("invalid");
    const identity = this.db
      .prepare(
        "SELECT user_id,status FROM platform_auth_identities WHERE auth_provider=? AND auth_subject=?",
      )
      .get(provider, subject) as
      | { user_id: string; status: string }
      | undefined;
    const primary = this.db
      .prepare(
        "SELECT user_id FROM platform_users WHERE auth_provider=? AND auth_subject=?",
      )
      .get(provider, subject) as { user_id: string } | undefined;
    if (primary && primary.user_id !== userId)
      throw new PlatformLoginError("conflict");
    if (
      provider === "discord" &&
      subject === readProtectedInitialOwnerDiscordSubject() &&
      !identity
    )
      throw new PlatformLoginError("conflict");
    if (identity && identity.user_id !== userId)
      throw new PlatformLoginError("conflict");
    const active = this.db
      .prepare(
        "SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider=? AND status='active'",
      )
      .get(userId, provider) as { auth_subject: string } | undefined;
    if (active && active.auth_subject !== subject)
      throw new PlatformLoginError("conflict");
    if (identity?.status === "revoked") {
      this.db
        .prepare(
          "UPDATE platform_auth_identities SET status='active',updated_at_utc=? WHERE auth_provider=? AND auth_subject=? AND user_id=?",
        )
        .run(this.now(), provider, subject, userId);
      this.audit(userId, provider, "reconnect");
    } else if (!identity) {
      new PlatformAuthenticationRepository(this.db).linkIdentity({
        userId,
        authProvider: provider,
        authSubject: subject,
        linkedByUserId: userId,
        timestamp: this.now(),
      });
      this.audit(userId, provider, "link");
    }
  }
  assertOAuthEmailAvailable(
    provider: "google" | "discord",
    subject: string,
    email: string | null,
  ) {
    if (
      !email ||
      new PlatformAuthenticationRepository(this.db).findActiveIdentity(
        provider,
        subject,
      )
    )
      return;
    const normalized = normalizeLoginEmail(email);
    if (
      this.credential(normalized) ||
      this.db
        .prepare(
          "SELECT 1 FROM platform_login_verified_emails WHERE email_normalized=?",
        )
        .get(normalized)
    )
      throw new PlatformLoginError("conflict");
  }
  recordOAuthProfile(input: {
    provider: "google" | "discord";
    subject: string;
    displayName: string;
    accountName?: string;
    verifiedEmail?: string | null;
  }) {
    // Labels are display-only provider evidence; never use them to merge or authorize accounts.
    const identity = new PlatformAuthenticationRepository(this.db).findActiveIdentity(input.provider, input.subject);
    if (!identity) throw new PlatformLoginError("invalid");
    const name = (input.accountName ?? input.displayName).normalize("NFKC").replace(/[\u0000-\u001f\u007f]/gu, "").trim().slice(0, 120);
    if (!name) return;
    this.db.prepare(`INSERT INTO platform_login_identity_profiles
      (auth_provider,auth_subject,display_name,verified_email,updated_at_utc) VALUES (?,?,?,?,?)
      ON CONFLICT(auth_provider,auth_subject) DO UPDATE SET display_name=excluded.display_name,
        verified_email=excluded.verified_email,updated_at_utc=excluded.updated_at_utc`)
      .run(input.provider, input.subject, name, input.verifiedEmail ? normalizeLoginEmail(input.verifiedEmail) : null, this.now());
  }
  recordVerifiedOAuthEmail(
    provider: "google" | "discord",
    subject: string,
    email: string,
  ) {
    const identity = new PlatformAuthenticationRepository(
      this.db,
    ).findActiveIdentity(provider, subject);
    if (!identity) throw new PlatformLoginError("invalid");
    const normalized = normalizeLoginEmail(email);
    const claimed = this.db
      .prepare(
        "SELECT user_id FROM platform_login_verified_emails WHERE email_normalized=?",
      )
      .get(normalized) as { user_id: string } | undefined;
    // An established subject remains authoritative even when its contact email
    // changes or has been reassigned; never merge accounts through that address.
    if (!claimed || claimed.user_id === identity.userId)
      this.claimEmail(identity.userId, normalized);
  }
  signInOAuth(input: {
    provider: "google" | "discord";
    subject: string;
    displayName: string;
    accountName?: string;
    verifiedEmail?: string | null;
    linkIntent?: string | null;
    currentSession?: string | null;
    clientLabel?: string | null;
  }) {
    return this.db
      .transaction(() => {
        let userId: string;
        if (input.linkIntent) {
          const intent = this.readToken(input.linkIntent, "link_provider");
          const current = this.authenticated(input.currentSession ?? null);
          if (
            intent.user_id !== current.userId ||
            intent.session_id !== current.sessionId ||
            intent.provider !== input.provider
          )
            throw new PlatformLoginError("invalid");
          userId = current.userId;
          this.linkIdentity(userId, input.provider, input.subject);
          this.consume(input.linkIntent);
        } else {
          const existing = new PlatformAuthenticationRepository(
            this.db,
          ).findActiveIdentity(input.provider, input.subject);
          if (!existing && input.verifiedEmail) {
            const email = normalizeLoginEmail(input.verifiedEmail);
            if (
              this.credential(email) ||
              this.db
                .prepare(
                  "SELECT 1 FROM platform_login_verified_emails WHERE email_normalized=?",
                )
                .get(email)
            )
              throw new PlatformLoginError("conflict");
          }
          userId = provisionVerifiedPlatformIdentity(this.db, {
            authProvider: input.provider,
            authSubject: input.subject,
            protectedInitialOwnerAuthSubject:
              input.provider === "discord"
                ? readProtectedInitialOwnerDiscordSubject()
                : undefined,
            displayName: input.displayName,
            timestamp: this.now(),
          }).userId;
        }
        if (input.verifiedEmail)
          this.recordVerifiedOAuthEmail(
            input.provider,
            input.subject,
            input.verifiedEmail,
          );
        this.recordOAuthProfile(input);
        new PlatformAuthenticationRepository(this.db).markAuthenticated({
          authProvider: input.provider,
          authSubject: input.subject,
          timestamp: this.now(),
        });
        const session = this.createSession(
          userId,
          input.provider,
          input.subject,
          input.clientLabel ?? null,
        );
        if (input.currentSession)
          new PlatformSessionService(new PlatformSessionRepository(this.db), {
            now: this.options.now,
          }).revoke(input.currentSession);
        return session;
      })
      .immediate();
  }
  endSession(token: string | null) {
    if (token)
      new PlatformSessionService(new PlatformSessionRepository(this.db), {
        now: this.options.now,
      }).revoke(token);
  }
  methodDetails(token: string | null): LoginMethodDetails {
    const session = this.authenticated(token);
    const connected = this.connected(token);
    const credential = this.db.prepare(
      "SELECT email_normalized, verified_at_utc FROM platform_login_credentials WHERE user_id=?",
    ).get(session.userId) as { email_normalized: string; verified_at_utc: string | null } | undefined;
    const pending = this.db.prepare(`SELECT pending_email FROM platform_login_tokens
      WHERE user_id=? AND purpose='change_email' AND consumed_at_utc IS NULL AND expires_at_utc>?
      ORDER BY created_at_utc DESC LIMIT 1`).get(session.userId, this.now()) as { pending_email: string } | undefined;
    return {
      signedInWith: session.authProvider,
      providers: connected.map(({ provider }) => {
        const profile = provider === "email" ? undefined : this.db.prepare(`SELECT p.display_name,p.verified_email
          FROM platform_login_identity_profiles p JOIN platform_auth_identities i
          ON i.auth_provider=p.auth_provider AND i.auth_subject=p.auth_subject
          WHERE i.user_id=? AND i.auth_provider=? AND i.status='active'`).get(session.userId, provider) as
          { display_name: string; verified_email: string | null } | undefined;
        return { provider, connected: true, accountName: profile?.display_name ?? null, email: profile?.verified_email ?? null };
      }),
      email: {
        address: credential?.email_normalized ?? null,
        verified: Boolean(credential?.verified_at_utc),
        connected: connected.some(method => method.provider === "email"),
        pendingAddress: pending?.pending_email ?? null,
      },
    };
  }
  connected(token: string | null) {
    const session = this.session(token);
    if (!session) throw new PlatformLoginError("invalid");
    return this.db
      .prepare(
        "SELECT auth_provider AS provider FROM platform_auth_identities WHERE user_id=? AND status='active' ORDER BY auth_provider",
      )
      .all(session.userId) as { provider: LoginProvider }[];
  }
  unlink(currentSession: string | null, provider: LoginProvider) {
    this.db
      .transaction(() => {
        const session = this.authenticated(currentSession);
        const methods = this.connected(currentSession);
        if (!methods.some((method) => method.provider === provider))
          throw new PlatformLoginError("invalid");
        if (
          !methods.some(
            (method) =>
              method.provider !== provider &&
              (
                this.options.usableProviders ?? ["google", "discord", "email"]
              ).includes(method.provider) &&
              (method.provider !== "email" ||
                this.db
                  .prepare(
                    "SELECT 1 FROM platform_login_credentials WHERE user_id=? AND verified_at_utc IS NOT NULL",
                  )
                  .get(session.userId)),
          )
        )
          throw new PlatformLoginError("last_method");
        // Membership snapshot updates require the Discord identity to remain active.
        if (provider === "discord")
          this.db
            .prepare(
              "UPDATE platform_discord_memberships SET role_ids_json='[]',guild_owner=0,last_verified_at_utc=? WHERE user_id=?",
            )
            .run(this.now(), session.userId);
        this.db
          .prepare(
            "UPDATE platform_auth_identities SET status='revoked',updated_at_utc=? WHERE user_id=? AND auth_provider=? AND status='active'",
          )
          .run(this.now(), session.userId, provider);
        this.db
          .prepare(
            "UPDATE platform_auth_sessions SET revoked_at_utc=? WHERE user_id=? AND auth_provider=? AND revoked_at_utc IS NULL",
          )
          .run(this.now(), session.userId, provider);
        if (provider === "email")
          this.db
            .prepare(`UPDATE platform_login_tokens SET consumed_at_utc=?
            WHERE credential_id IN (SELECT credential_id FROM platform_login_credentials WHERE user_id=?)
            AND consumed_at_utc IS NULL`)
            .run(this.now(), session.userId);
        this.audit(session.userId, provider, "unlink");
      })
      .immediate();
  }
}
