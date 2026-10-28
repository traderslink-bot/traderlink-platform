import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake } from "../contracts/partner-alert-validation";

export type PartnerAlertGatewaySession = Readonly<{ sessionId: string; resumeUrl: string; sequence: number }>;
export type PartnerAlertGatewayDispatch = Readonly<{
  type: "MESSAGE_CREATE" | "MESSAGE_UPDATE" | "MESSAGE_DELETE" | "MESSAGE_DELETE_BULK";
  data: Readonly<Record<string, unknown>>;
}>;
/** Adapter is deliberately absent: constructing this protocol driver opens nothing. */
export interface PartnerAlertGatewaySocket {
  onMessage(handler: (text: string) => void): void;
  onClose(handler: (code: number) => void): void;
  onError(handler: () => void): void;
  send(text: string): void;
  close(code: number, reason: string): void;
}
export type PartnerAlertGatewayConfiguration = Readonly<{
  enabled: boolean;
  botToken: string;
  expectedBotUserId: string;
  socketFactory: (url: string) => PartnerAlertGatewaySocket;
  hasExclusiveReceiverLease: () => boolean;
  identifyAllowed: () => boolean;
  shouldReceive: (guildId: string, channelId: string) => boolean;
  loadSession: () => PartnerAlertGatewaySession | null;
  saveSession: (session: PartnerAlertGatewaySession) => void;
  clearSession: () => void;
  markGap: (reason: string) => void;
  attention: (reason: string) => void;
  onDispatch: (event: PartnerAlertGatewayDispatch) => Promise<void>;
  schedule: (callback: () => void, delayMs: number) => unknown;
  cancel: (handle: unknown) => void;
  random: () => number;
}>;

function gatewayUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "wss:" || (url.hostname !== "gateway.discord.gg" && !url.hostname.endsWith(".discord.gg"))
    || url.username || url.password || url.port || url.pathname !== "/" || url.hash) {
    throw new PartnerAlertValidationError("gateway");
  }
  url.search = ""; url.searchParams.set("v", "10"); url.searchParams.set("encoding", "json");
  return url.href;
}

/**
 * Explicit-start protocol driver with injected socket/scheduler/persistence.
 * No actual WebSocket constructor, timer, credentials or startup on import.
 * The runtime must grant one receiver lease and Discord identify allowance.
 */
export class PartnerAlertDiscordGateway {
  private running = false;
  private generation = 0;
  private socket: PartnerAlertGatewaySocket | null = null;
  private session: PartnerAlertGatewaySession | null = null;
  private receivedSequence: number | null = null;
  private heartbeatTimer: unknown = null;
  private reconnectTimer: unknown = null;
  private helloTimer: unknown = null;
  private heartbeatPending = false;
  private heartbeatInterval = 0;
  private reconnectAttempts = 0;
  private queued = 0;
  private chain = Promise.resolve();

  constructor(private readonly configuration: PartnerAlertGatewayConfiguration) {
    partnerAlertSnowflake(configuration.expectedBotUserId, "expectedBotUserId");
    if (typeof configuration.botToken !== "string" || !configuration.botToken
      || configuration.botToken.length > 8192 || /[\u0000-\u0020\u007f]/u.test(configuration.botToken)) {
      throw new PartnerAlertValidationError("gatewayConfiguration");
    }
  }
  start(): boolean {
    if (this.configuration.enabled !== true || this.running) return false;
    if (!this.configuration.hasExclusiveReceiverLease()) return false;
    const saved = this.configuration.loadSession();
    if (saved) {
      partnerAlertInteger(saved.sequence, "sequence"); gatewayUrl(saved.resumeUrl);
      if (!/^[A-Za-z0-9_-]{1,256}$/u.test(saved.sessionId)) throw new PartnerAlertValidationError("gatewaySession");
    }
    this.session = saved; this.running = true; this.connect(); return true;
  }
  stop(): void {
    this.running = false; this.generation += 1; this.clearTimers();
    const socket = this.socket; this.socket = null;
    if (socket) socket.close(1000, "receiver_stopped");
  }
  private clearTimers(): void {
    for (const timer of [this.heartbeatTimer, this.reconnectTimer, this.helloTimer]) {
      if (timer !== null) this.configuration.cancel(timer);
    }
    this.heartbeatTimer = null; this.reconnectTimer = null; this.helloTimer = null;
  }
  private report(reason: string): void {
    try { this.configuration.attention(reason); } catch { /* Reporting must not strand the receiver chain. */ }
  }
  private gap(reason: string): void {
    try { this.configuration.markGap(reason); }
    catch { this.report("gateway_gap_storage_unavailable"); this.stop(); }
  }
  private connect(): void {
    if (!this.running) return;
    if (!this.configuration.hasExclusiveReceiverLease()) { this.report("receiver_lease_lost"); this.stop(); return; }
    const generation = ++this.generation;
    this.heartbeatPending = false; this.heartbeatInterval = 0;
    this.receivedSequence = this.session?.sequence ?? null;
    try {
      this.socket = this.configuration.socketFactory(gatewayUrl(this.session?.resumeUrl ?? "wss://gateway.discord.gg/"));
      this.socket.onMessage(text => { if (generation === this.generation && this.running) this.receive(text, generation); });
      this.socket.onError(() => { if (generation === this.generation) this.reconnect("socket_unavailable"); });
      this.socket.onClose(code => {
        if (generation !== this.generation || !this.running) return;
        if ([4004, 4010, 4011, 4012, 4013, 4014].includes(code)) { this.report("gateway_configuration_required"); this.stop(); return; }
        if ([4007, 4009].includes(code)) this.forgetSession("gateway_session_lost");
        this.reconnect("gateway_disconnected");
      });
      this.helloTimer = this.configuration.schedule(() => {
        if (generation === this.generation) this.reconnect("gateway_hello_missing");
      }, 15_000);
    } catch { this.reconnect("socket_unavailable"); }
  }
  private forgetSession(reason: string): void {
    this.session = null; this.receivedSequence = null;
    try { this.configuration.clearSession(); }
    catch { this.report("gateway_session_storage_unavailable"); this.stop(); }
    this.gap(reason);
  }
  private reconnect(reason: string): void {
    if (!this.running || this.reconnectTimer !== null) return;
    this.generation += 1; this.clearTimers();
    const socket = this.socket; this.socket = null;
    if (socket) socket.close(4000, "receiver_reconnecting");
    this.report(reason);
    const delay = Math.min(30_000, 5000 * 2 ** Math.min(this.reconnectAttempts++, 3));
    this.reconnectTimer = this.configuration.schedule(() => {
      this.reconnectTimer = null; this.connect();
    }, delay);
  }
  private send(op: number, data: unknown): void {
    if (!this.running || !this.socket || !this.configuration.hasExclusiveReceiverLease()) {
      throw new PartnerAlertValidationError("gatewayLease");
    }
    this.socket.send(JSON.stringify({ op, d: data }));
  }
  private heartbeat(generation: number): void {
    if (!this.running || generation !== this.generation) return;
    if (this.heartbeatPending) { this.reconnect("heartbeat_missing"); return; }
    try { this.send(1, this.receivedSequence); this.heartbeatPending = true; }
    catch { this.reconnect("heartbeat_unavailable"); return; }
    this.heartbeatTimer = this.configuration.schedule(() => this.heartbeat(generation), this.heartbeatInterval);
  }
  private receive(text: string, generation: number): void {
    try {
      if (typeof text !== "string" || text.length > 1_000_000) throw new PartnerAlertValidationError("gatewayPayload");
      const packet = partnerAlertRecord(JSON.parse(text), "gatewayPayload");
      if (packet.op === 10) {
        if (this.heartbeatInterval !== 0 && this.helloTimer === null) throw new PartnerAlertValidationError("gatewayHello");
        if (this.helloTimer !== null) this.configuration.cancel(this.helloTimer);
        this.helloTimer = null;
        const hello = partnerAlertRecord(packet.d, "gatewayHello");
        this.heartbeatInterval = partnerAlertInteger(hello.heartbeat_interval, "heartbeatInterval", 1000, 120_000);
        const jitter = this.configuration.random();
        if (!Number.isFinite(jitter) || jitter < 0 || jitter >= 1) throw new PartnerAlertValidationError("gatewayRandom");
        this.heartbeatTimer = this.configuration.schedule(() => this.heartbeat(generation), Math.floor(jitter * this.heartbeatInterval));
        if (this.session) this.send(6, { token: this.configuration.botToken,
          session_id: this.session.sessionId, seq: this.session.sequence });
        else {
          if (!this.configuration.identifyAllowed()) { this.report("gateway_identify_not_authorised"); this.stop(); return; }
          this.send(2, { token: this.configuration.botToken, intents: 33281,
            properties: { os: "linux", browser: "TradersLink", device: "TradersLink" } });
        }
      } else if (packet.op === 11) this.heartbeatPending = false;
      else if (packet.op === 1) { this.send(1, this.receivedSequence); this.heartbeatPending = true; }
      else if (packet.op === 7) this.reconnect("gateway_reconnect_requested");
      else if (packet.op === 9) {
        if (packet.d !== true) this.forgetSession("gateway_resume_unavailable");
        this.reconnect("gateway_invalid_session");
      } else if (packet.op === 0) {
        const sequence = partnerAlertInteger(packet.s, "sequence");
        this.receivedSequence = sequence;
        if (typeof packet.t !== "string" || this.queued >= 256) throw new PartnerAlertValidationError("gatewayQueue");
        const type = packet.t;
        const data = packet.d;
        this.queued += 1;
        this.chain = this.chain.then(async () => {
          if (!this.running || generation !== this.generation) return;
          if (type !== "READY" && this.session && sequence <= this.session.sequence) return;
          let nextSession = this.session;
          if (type === "READY") {
            const ready = partnerAlertRecord(data, "gatewayReady");
            if (partnerAlertRecord(ready.user, "botUser").id !== this.configuration.expectedBotUserId
              || typeof ready.session_id !== "string" || !/^[A-Za-z0-9_-]{1,256}$/u.test(ready.session_id)
              || typeof ready.resume_gateway_url !== "string") throw new PartnerAlertValidationError("gatewayReady");
            nextSession = { sessionId: ready.session_id, resumeUrl: gatewayUrl(ready.resume_gateway_url), sequence };
            this.reconnectAttempts = 0;
          } else if (type === "RESUMED") {
            this.reconnectAttempts = 0;
          } else if (["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK"].includes(type)) {
            const message = partnerAlertRecord(data, "gatewayMessage");
            if (typeof message.guild_id === "string" && typeof message.channel_id === "string"
              && this.configuration.shouldReceive(message.guild_id, message.channel_id)) {
              await this.configuration.onDispatch({ type: type as PartnerAlertGatewayDispatch["type"], data: message });
            }
          }
          if (generation === this.generation && nextSession) {
            const next = Object.freeze({ ...nextSession, sequence });
            try { this.configuration.saveSession(next); }
            catch { this.report("gateway_session_storage_unavailable"); this.gap("dispatch_not_committed"); this.stop(); return; }
            this.session = next;
          }
        }).catch(() => {
          this.gap("dispatch_not_committed"); this.reconnect("dispatch_not_committed");
        }).finally(() => { this.queued -= 1; });
      }
    } catch { this.gap("gateway_payload_unavailable"); this.reconnect("gateway_payload_unavailable"); }
  }
}
