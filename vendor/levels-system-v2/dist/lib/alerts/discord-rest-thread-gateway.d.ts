import type { AlertPayload, DiscordThread, LevelExtensionPayload, LevelSnapshotPayload } from "./alert-types.js";
import type { DiscordThreadGateway } from "./alert-router.js";
type FetchLike = typeof fetch;
export type DiscordRestThreadGatewayOptions = {
    botToken: string;
    watchlistChannelId: string;
    guildId?: string;
    fetchImpl?: FetchLike;
    apiBaseUrl?: string;
    autoArchiveDurationMinutes?: 60 | 1440 | 4320 | 10080;
};
export declare class DiscordRestThreadGateway implements DiscordThreadGateway {
    private readonly botToken;
    private readonly watchlistChannelId;
    private readonly guildId?;
    private readonly fetchImpl;
    private readonly apiBaseUrl;
    private readonly autoArchiveDurationMinutes;
    constructor(options: DiscordRestThreadGatewayOptions);
    private request;
    private postMessage;
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    private findMatchingThread;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
export {};
//# sourceMappingURL=discord-rest-thread-gateway.d.ts.map