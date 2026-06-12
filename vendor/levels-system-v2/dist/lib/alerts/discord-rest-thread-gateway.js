import { formatLevelExtensionMessage, formatLevelSnapshotMessage } from "./alert-router.js";
const DEFAULT_API_BASE_URL = "https://discord.com/api/v10";
function normalizeNonEmpty(value, label) {
    const normalized = value?.trim();
    if (!normalized) {
        throw new Error(`${label} is required for Discord REST gateway.`);
    }
    return normalized;
}
function buildAlertMessageContent(payload) {
    return `${payload.title}\n${payload.body}`;
}
async function parseDiscordJson(response) {
    const text = await response.text();
    if (!text.trim()) {
        return null;
    }
    return JSON.parse(text);
}
export class DiscordRestThreadGateway {
    botToken;
    watchlistChannelId;
    guildId;
    fetchImpl;
    apiBaseUrl;
    autoArchiveDurationMinutes;
    constructor(options) {
        this.botToken = normalizeNonEmpty(options.botToken, "Discord bot token");
        this.watchlistChannelId = normalizeNonEmpty(options.watchlistChannelId, "Discord watchlist channel id");
        this.guildId = options.guildId?.trim() || undefined;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.apiBaseUrl = options.apiBaseUrl?.trim() || DEFAULT_API_BASE_URL;
        this.autoArchiveDurationMinutes = options.autoArchiveDurationMinutes ?? 1440;
    }
    async request(path, init) {
        const response = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: `Bot ${this.botToken}`,
                "Content-Type": "application/json",
                ...(init?.headers ?? {}),
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Discord API request failed (${response.status}) for ${path}: ${body || response.statusText}`);
        }
        return (await parseDiscordJson(response));
    }
    async postMessage(channelId, content) {
        return this.request(`/channels/${channelId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content }),
        });
    }
    async getThreadById(threadId) {
        try {
            const channel = await this.request(`/channels/${threadId}`);
            if (channel.parent_id && channel.parent_id !== this.watchlistChannelId) {
                return null;
            }
            return {
                id: channel.id,
                name: channel.name ?? "",
            };
        }
        catch {
            return null;
        }
    }
    findMatchingThread(threads, name) {
        const match = threads.find((thread) => thread.name === name && thread.parent_id === this.watchlistChannelId);
        if (!match) {
            return null;
        }
        return {
            id: match.id,
            name: match.name ?? name,
        };
    }
    async findThreadByName(name) {
        if (this.guildId) {
            try {
                const active = await this.request(`/guilds/${this.guildId}/threads/active`);
                const activeMatch = this.findMatchingThread(active.threads ?? [], name);
                if (activeMatch) {
                    return activeMatch;
                }
            }
            catch {
                // Keep recovery deterministic: a failed active-thread lookup just falls through.
            }
        }
        try {
            const archived = await this.request(`/channels/${this.watchlistChannelId}/threads/archived/public?limit=100`);
            return this.findMatchingThread(archived.threads ?? [], name);
        }
        catch {
            return null;
        }
    }
    async createThread(name) {
        const starterMessage = await this.postMessage(this.watchlistChannelId, name);
        const thread = await this.request(`/channels/${this.watchlistChannelId}/messages/${starterMessage.id}/threads`, {
            method: "POST",
            body: JSON.stringify({
                name,
                auto_archive_duration: this.autoArchiveDurationMinutes,
            }),
        });
        return {
            id: thread.id,
            name: thread.name ?? name,
        };
    }
    async sendMessage(threadId, payload) {
        await this.postMessage(threadId, buildAlertMessageContent(payload));
    }
    async sendLevelSnapshot(threadId, payload) {
        await this.postMessage(threadId, formatLevelSnapshotMessage(payload));
    }
    async sendLevelExtension(threadId, payload) {
        await this.postMessage(threadId, formatLevelExtensionMessage(payload));
    }
}
