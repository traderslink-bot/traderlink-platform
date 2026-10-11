import "server-only";
import { randomBytes } from "node:crypto";
import {
  isSelectableNotificationRoleKey, selectableNotificationRoles, openSelectorId,
  privateNotice, privateSelectorPayload, type NotificationRoleKey,
} from "./catalog";
import {
  isDiscordId, notificationRoleConfiguration, notificationRoleSelectorEnabled,
  type NotificationRoleConfiguration,
} from "./configuration";
import { NotificationRoleApiError, NotificationRoleDiscordApi } from "./discord-api";

const expired = "This selection has expired. Choose notifications again.";
const unavailable = "Notification selection is temporarily unavailable. Please contact a moderator.";
const failed = "We couldn't save all your choices. Reopen your notifications to check your current roles and try again.";
const sessionLifetime = 10 * 60_000;

type Session = {
  id: string; memberId: string; guildId: string; version: string;
  expiresAt: number; selected: NotificationRoleKey[]; busy: boolean;
};
type Callback = { type: number; data?: Record<string, unknown> };
type Dispatch = { response: Callback; work?: () => Promise<void> };
type State = {
  sessions: Map<string, Session>;
  receipts: Map<string, { expiresAt: number; response: Callback }>;
  locks: Map<string, { tail: Promise<void>; count: number }>;
};
// One persistent-volume app / one process. No separate worker, database or Gateway connection.
const processState = globalThis as typeof globalThis & { traderLinkNotificationRoleState?: State };
const state = processState.traderLinkNotificationRoleState ??= {
  sessions: new Map(), receipts: new Map(), locks: new Map(),
};

function prune(now: number) {
  for (const [key, session] of state.sessions) if (session.expiresAt <= now && !session.busy) state.sessions.delete(key);
  for (const [key, receipt] of state.receipts) if (receipt.expiresAt <= now) state.receipts.delete(key);
}

function notice(content: string): Dispatch {
  return { response: { type: 4, data: { ...privateNotice(content), flags: 64 } } };
}

/** Reserve order before returning the acknowledgement; all member writes are serialized. */
function reserve(memberKey: string): (() => Promise<() => void>) | null {
  const lock = state.locks.get(memberKey) ?? { tail: Promise.resolve(), count: 0 };
  // Reject overlap instead of keeping REST jobs waiting beyond their response lifetime.
  if (lock.count >= 1 || (!state.locks.has(memberKey) && state.locks.size >= 1_000)) return null;
  const previous = lock.tail;
  let release!: () => void;
  lock.tail = new Promise<void>(resolve => { release = resolve; });
  lock.count += 1;
  state.locks.set(memberKey, lock);
  return async () => {
    await previous;
    return () => {
      release();
      lock.count -= 1;
      if (lock.count === 0 && state.locks.get(memberKey) === lock) state.locks.delete(memberKey);
    };
  };
}

function active(config: NotificationRoleConfiguration): boolean {
  return notificationRoleSelectorEnabled() && notificationRoleConfiguration()?.version === config.version;
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Called only after raw-body signature validation; no member ID comes from client component values. */
export function dispatchNotificationRoleInteraction(payload: unknown, config: NotificationRoleConfiguration): Dispatch {
  const input = object(payload);
  if (!input || input.application_id !== config.applicationId) return notice(unavailable);
  if (input.type === 1) return { response: { type: 1 } };
  const member = object(input.member);
  const user = object(member?.user);
  const data = object(input.data);
  const message = object(input.message);
  const author = object(message?.author);
  const channel = object(input.channel);
  const channelId = input.channel_id ?? channel?.id;
  if (input.type !== 3 || input.guild_id !== config.guildId || channelId !== config.channelId
    || (channel?.id !== undefined && channel.id !== config.channelId)
    || !isDiscordId(input.id) || !isDiscordId(user?.id) || user?.bot === true
    || typeof input.token !== "string" || !/^[A-Za-z0-9._-]{20,2048}$/u.test(input.token)
    || !data || typeof data.custom_id !== "string" || !message || !isDiscordId(message.id)
    || author?.id !== config.applicationId) return notice(unavailable);

  const now = Date.now();
  prune(now);
  const receiptKey = `${config.version}:${input.id}`;
  const receipt = state.receipts.get(receiptKey);
  if (receipt) return { response: receipt.response }; // Replay acknowledgement; never schedule a second job.
  if (state.receipts.size >= 4_096) return notice("Please try again in a few minutes.");
  const memberId = user.id;
  const memberKey = `${config.guildId}:${memberId}`;
  const token = input.token;
  let result: Dispatch;

  if (data.custom_id === openSelectorId) {
    if (data.component_type !== 2 || !config.panelMessageId || message.id !== config.panelMessageId) return notice(unavailable);
    if (state.sessions.size >= 2_000) return notice("Please try again in a few minutes.");
    const acquire = reserve(memberKey);
    if (!acquire) return notice("Please wait for your current selection to finish, then try again.");
    result = {
      response: { type: 5, data: { flags: 64 } },
      work: async () => {
        const release = await acquire();
        const api = new NotificationRoleDiscordApi(config);
        try {
          if (!active(config)) throw new Error("Disabled");
          await api.verifySetup();
          const roles = await api.memberRoles(memberId);
          for (const [id, session] of state.sessions) {
            if (session.guildId === config.guildId && session.memberId === memberId) state.sessions.delete(id);
          }
          if (state.sessions.size >= 2_000) throw new Error("Unavailable");
          const id = randomBytes(16).toString("hex");
          const selected = selectableNotificationRoles.filter(role => roles.includes(config.roleIds[role.key])).map(role => role.key);
          const session: Session = { id, memberId, guildId: config.guildId, version: config.version,
            expiresAt: Date.now() + sessionLifetime, selected, busy: false };
          state.sessions.set(id, session);
          try { await api.editInteraction(token, privateSelectorPayload(id, selected)); }
          catch { state.sessions.delete(id); throw new Error("Unavailable"); }
        } catch {
          await new NotificationRoleDiscordApi(config, Date.now() + 5_000).editInteraction(token, privateNotice(unavailable)).catch(() => {});
        } finally { release(); }
      },
    };
  } else {
    const match = /^tl:nr:v1:([a-f\d]{32}):(select|clear|save)$/u.exec(data.custom_id);
    if (!match || typeof message.flags !== "number" || (message.flags & 64) === 0) return notice(expired);
    const session = state.sessions.get(match[1]);
    if (!session || session.memberId !== memberId || session.guildId !== config.guildId
      || session.version !== config.version || session.expiresAt <= now) return notice(expired);
    if (session.busy) return notice("Your choices are being saved. Please wait, then choose notifications again.");
    const action = match[2];
    if ((action === "select" && data.component_type !== 3) || (action !== "select" && data.component_type !== 2)) return notice(expired);
    if (action === "select") {
      if (!Array.isArray(data.values) || data.values.length > selectableNotificationRoles.length
        || !data.values.every(isSelectableNotificationRoleKey) || new Set(data.values).size !== data.values.length) return notice(unavailable);
      session.selected = [...data.values] as NotificationRoleKey[];
      // Keep the client-owned dropdown stable; a full ephemeral re-render can stall desktop Save.
      result = { response: { type: 6 } };
    } else if (action === "clear") {
      session.selected = [];
      result = { response: { type: 7, data: privateSelectorPayload(session.id, [], "Selection cleared. Select Save to turn these notifications off.") } };
    } else {
      const acquire = reserve(memberKey);
      if (!acquire) return notice("Please wait for your current selection to finish, then try again.");
      session.busy = true;
      const desired = new Set(session.selected);
      result = {
        response: { type: 7, data: privateNotice("Saving your notifications…") },
        work: async () => {
          const release = await acquire();
          let content = failed;
          let phase = "verify";
          const startedAt = Date.now();
          let completedChanges = 0;
          let totalChanges = 0;
          try {
            if (!active(config) || state.sessions.get(session.id) !== session || session.expiresAt <= Date.now()) throw new Error("Expired");
            await new NotificationRoleDiscordApi(config, Date.now() + 25_000, phase).verifySetup();
            phase = "read-current";
            const current = new Set(await new NotificationRoleDiscordApi(config, Date.now() + 15_000, phase).memberRoles(memberId));
            const changes = selectableNotificationRoles.filter(role => current.has(config.roleIds[role.key]) !== desired.has(role.key));
            totalChanges = changes.length;
            phase = "write";
            const writeApi = new NotificationRoleDiscordApi(config, Date.now() + 90_000, phase);
            for (const role of changes) {
              if (!active(config) || session.expiresAt <= Date.now()) throw new Error("Disabled");
              const present = desired.has(role.key);
              await writeApi.setRole(memberId, role.key, present);
              completedChanges += 1;
            }
            phase = "readback";
            const actual = new Set(await new NotificationRoleDiscordApi(config, Date.now() + 15_000, phase).memberRoles(memberId));
            if (!selectableNotificationRoles.every(role => actual.has(config.roleIds[role.key]) === desired.has(role.key))) throw new Error("Partial");
            const labels = selectableNotificationRoles.filter(role => desired.has(role.key)).map(role => role.label);
            content = labels.length ? `Saved. You're subscribed to: ${labels.join(", ")}.` : "Saved. You're not subscribed to any of these notifications.";
          } catch (error) {
            // Discord has no multi-role transaction. Do not undo unrelated moderator changes or claim success.
            content = failed;
            console.warn("Discord notification selector save failed", {
              category: error instanceof NotificationRoleApiError ? error.category : "state-or-readback",
              httpStatus: error instanceof NotificationRoleApiError ? error.httpStatus : undefined,
              retryDelaySeconds: error instanceof NotificationRoleApiError ? error.retryDelaySeconds : undefined,
              phase, elapsedMs: Date.now() - startedAt, completedChanges, totalChanges,
            });
          } finally {
            state.sessions.delete(session.id);
            release();
          }
          await new NotificationRoleDiscordApi(config, Date.now() + 10_000, "confirmation")
            .editInteraction(token, privateNotice(content)).catch(error => {
              console.warn("Discord notification selector confirmation failed", {
                category: error instanceof NotificationRoleApiError ? error.category : "confirmation",
                httpStatus: error instanceof NotificationRoleApiError ? error.httpStatus : undefined,
                phase: "confirmation", elapsedMs: Date.now() - startedAt, completedChanges, totalChanges,
              });
            });
        },
      };
    }
  }
  state.receipts.set(receiptKey, { expiresAt: now + sessionLifetime, response: result.response });
  return result;
}
