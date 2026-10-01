export type ReviewState = {
  cycleId: string;
  events: readonly {
    revision: number;
    at?: number;
    body: {
      kind: string;
      channel?: string;
      status?: string;
      approvalRevision?: number;
      publication?: { discordWatchlistGroup?: string };
      receipt?: { channelId: string; messageId: string };
    };
  }[];
};
