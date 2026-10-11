export type CommunityDiscordResources = Readonly<{
  roles: readonly { id: string; name: string }[];
  channels: readonly { id: string; name: string; canPublish: boolean }[];
}>;
