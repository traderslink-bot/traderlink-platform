import { notificationPanelPayload } from "../modules/platform/server/discord-notification-roles/catalog";
import { notificationRoleConfiguration } from "../modules/platform/server/discord-notification-roles/configuration";
import { NotificationRoleDiscordApi } from "../modules/platform/server/discord-notification-roles/discord-api";

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(["--preview", "--publish", "--update", "--owner-approved-server-change"]);
  if (args.some(arg => !allowed.has(arg)) || new Set(args).size !== args.length) throw new Error("Unsupported arguments");
  const publish = args.includes("--publish");
  const update = args.includes("--update");
  if ((publish && update) || (args.includes("--preview") && (publish || update))) throw new Error("Choose one mode");
  const payload = notificationPanelPayload();
  if (!publish && !update) {
    // Default is entirely offline and never loads credentials or contacts Discord.
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  if (!args.includes("--owner-approved-server-change")) throw new Error("Explicit owner approval is required for server changes");
  const config = notificationRoleConfiguration();
  if (!config || (publish && config.panelMessageId) || (update && !config.panelMessageId)) {
    throw new Error("Panel configuration is missing or inconsistent; use update for an existing panel");
  }
  const api = new NotificationRoleDiscordApi(config);
  await api.verifySetup();
  if (update) {
    await api.updatePanel(payload);
    process.stdout.write("Notification panel updated. No roles were assigned.\n");
  } else {
    const id = await api.publishPanel(payload);
    process.stdout.write(`Notification panel created. Set TRADERLINK_DISCORD_NOTIFICATION_PANEL_MESSAGE_ID=${id} before enabling member interactions.\n`);
  }
}

main().catch(() => {
  // No provider errors or protected identifiers in CLI failures.
  process.stderr.write("Panel operation stopped. Check the mode, owner approval and bot configuration. No automatic retry will publish a second panel.\n");
  process.exitCode = 1;
});
