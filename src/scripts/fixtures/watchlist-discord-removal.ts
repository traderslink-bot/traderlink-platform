type DiscordMessageReceipt = {
  channelId: string;
  messageId: string;
};

export function queueCategoryMoveRemovals(
  _symbol: string,
  _receipts: readonly DiscordMessageReceipt[],
): void {}
