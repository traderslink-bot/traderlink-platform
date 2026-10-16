import assert from "node:assert/strict";
import { readMembershipDiscordChoices } from "../modules/platform/server/membership/membership-discord-editor-choices";

async function main() {
  const requests: { url: string; method: string | undefined }[] = [];
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", DISCORD_BOT_TOKEN: "synthetic-test-token-not-a-credential" };
  const mock: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), method: init?.method });
    return Response.json(String(url).includes("/roles")
      ? [{ id: "123", name: "@everyone" }, { id: "456", name: "Premium" }]
      : [{ id: "123", name: "QA server", ignoredPrivateField: "not exposed" }]);
  };
  assert.deepEqual((await readMembershipDiscordChoices({}, environment, mock)).items, [{ id: "123", name: "QA server" }]);
  assert.deepEqual((await readMembershipDiscordChoices({ guildId: "123" }, environment, mock)).items, [{ id: "456", name: "Premium" }]);
  await assert.rejects(readMembershipDiscordChoices({ guildId: "../messages" }, environment, mock));
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.method === "GET" && request.url.startsWith("https://discord.com/api/v10/")));
  await assert.rejects(readMembershipDiscordChoices({}, { NODE_ENV: "test" }, mock), /Connect the Platform/);
  const failed: typeof fetch = async () => new Response("private upstream error", { status: 403 });
  await assert.rejects(readMembershipDiscordChoices({}, environment, failed), error => error instanceof Error && !error.message.includes("private upstream"));
  console.log(JSON.stringify({ ok: true, mockedDiscordDiscovery: true, validatedPaths: true, getOnly: true, noCredentialsReturned: true, realNetworkCalls: 0 }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
