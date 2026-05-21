export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  guildId: string;
  redirectUri: string;
  inviteUrl: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface DiscordGuildMember {
  joined_at?: string | null;
  user?: DiscordUser;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

const DISCORD_API_BASE = "https://discord.com/api/v10";
const TRADERSLINK_DISCORD_GUILD_ID = "1433570740430573642";

export function getDiscordOAuthConfig(origin: string): DiscordOAuthConfig {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const guildId = process.env.DISCORD_GUILD_ID ?? TRADERSLINK_DISCORD_GUILD_ID;
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ??
    new URL("/api/auth/discord/callback", origin).toString();

  if (!clientId || !clientSecret || !guildId) {
    throw new Error(
      "Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.",
    );
  }

  return {
    clientId,
    clientSecret,
    guildId,
    redirectUri,
    inviteUrl: process.env.DISCORD_INVITE_URL ?? "/academy/",
  };
}

export function buildDiscordAuthorizeUrl(args: {
  config: DiscordOAuthConfig;
  state: string;
}): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", args.config.clientId);
  url.searchParams.set("redirect_uri", args.config.redirectUri);
  url.searchParams.set("scope", "identify guilds.members.read");
  url.searchParams.set("state", args.state);

  return url.toString();
}

export async function exchangeDiscordCode(args: {
  config: DiscordOAuthConfig;
  code: string;
}): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: args.config.clientId,
    client_secret: args.config.clientSecret,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.config.redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed with ${response.status}.`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

export async function fetchDiscordCurrentUser(
  accessToken: string,
): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord user lookup failed with ${response.status}.`);
  }

  return (await response.json()) as DiscordUser;
}

export async function fetchDiscordCurrentGuildMember(args: {
  accessToken: string;
  guildId: string;
}): Promise<DiscordGuildMember | null> {
  const response = await fetch(
    `${DISCORD_API_BASE}/users/@me/guilds/${args.guildId}/member`,
    {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
      },
    },
  );

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Discord guild membership check failed with ${response.status}.`,
    );
  }

  return (await response.json()) as DiscordGuildMember;
}
