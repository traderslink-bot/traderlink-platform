export type CommunityDiscordResources = Readonly<{
  guildName?: string;
  roles: readonly { id: string; name: string }[];
  channels: readonly { id: string; name: string; canPublish: boolean }[];
}>;
