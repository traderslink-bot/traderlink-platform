// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { afterAll, beforeAll, expect, it } from "vitest";

/** Actual current registered SQLite, Core, Auth/session/operator, request parsing,
 * native operator freshness refresh. Discord observations and
 * initial administrator grant are explicitly SYNTHETIC; no staging/provider proof. */
let directory: string;
let bundlePath: string;
const sourceRoot = process.cwd();
beforeAll(async () => {
  directory = mkdtempSync("/tmp/paid-operator-native-");
  const fixture = join(sourceRoot, "src/test/fixtures/premium-current-access-native-controller.ts");
  const original = readFileSync(fixture, "utf8"), marker = " const initial=capture();";
  expect(original.indexOf(marker)).toBeGreaterThan(0);
  expect(original.indexOf(marker)).toBe(original.lastIndexOf(marker));
  const prefix = original.slice(0, original.indexOf(marker));
  // Reuse native initialization only; the fixture's historical 204 qualifier
  // negatives have their own suite and execution-order assumptions.
  const negativesStart = prefix.indexOf(" // Correct actual204 must require");
  const negativesEnd = prefix.indexOf(" let core=bind(db);");
  expect(negativesStart).toBeGreaterThan(0);
  expect(negativesEnd).toBeGreaterThan(negativesStart);
  const initialization = (prefix.slice(0, negativesStart) + prefix.slice(negativesEnd))
    .replace("new PlatformDiscordSignInService(db,{now:()=>new Date(clock)})",
      "new PlatformDiscordSignInService(db,{now:()=>new Date(Date.parse(clock)-3600000)})");
  const program = imports + initialization + exercise
    + "\n}\nrun().catch(error=>{console.error(error);process.exitCode=1;});\n";
  const require = createRequire(import.meta.url);
  const bundled = await build({ entryPoints: [fixture], bundle: true, platform: "node", format: "cjs",
    target: "node22", packages: "external", write: false, logLevel: "silent", plugins: [{
      name: "current-source-native-context-no-authority-mocks", setup(plugin) {
        plugin.onResolve({ filter: /.*/ }, args => {
          if (args.path === "server-only") return { path: require.resolve("next/dist/compiled/server-only/empty.js") };
          const relative = args.path.startsWith("@/") ? args.path.slice(2) : null;
          if (relative) {
            const selected = ["", ".ts", ".tsx", ".js", ".json", "/index.ts"]
              .map(ext => join(sourceRoot, relative + ext)).find(path => existsSync(path));
            if (selected) return { path: selected };
          }
          if (args.path.startsWith(".")) {
            const absolute = resolve(args.resolveDir, args.path);
            if (!absolute.startsWith(sourceRoot + "/")) throw Error("Fixture escaped assigned current source");
          }
          return undefined;
        });
        plugin.onLoad({ filter: /\.tsx?$/ }, args => ({
          contents: (args.path === fixture ? program : readFileSync(args.path, "utf8"))
            .replace(/import\.meta\.url/g, JSON.stringify(pathToFileURL(args.path).href)),
          loader: args.path.endsWith(".tsx") ? "tsx" : "ts", resolveDir: dirname(args.path),
        }));
      },
    }] });
  bundlePath = join(directory, "case.cjs");
  writeFileSync(bundlePath, bundled.outputFiles[0]!.contents, { mode: 0o600 });
}, 30_000);
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });

const cases = ["operator-refresh"] as const;
it.each(cases)("native operator observation: %s", scenario => {
  const childDirectory = mkdtempSync(join(directory, "case-"));
  for (const file of ["membership/platform-premium-authority-repository.ts", "membership/platform-premium-whop-native.ts",
    "privacy/platform-premium-signer-redaction.ts"]) {
    const target = join(childDirectory, "src/modules/platform/server", file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(sourceRoot, "src/modules/platform/server", file)), { mode: 0o600 });
  }
  const child = spawnSync(process.execPath, [bundlePath, "--runtime-authority-unit", scenario], {
    cwd: childDirectory, env: { ...process.env, NODE_ENV: "test", NODE_PATH: join(sourceRoot, "node_modules") },
    encoding: "utf8", timeout: 30_000, maxBuffer: 128 * 1024,
  });
  expect(child.status, child.stderr + child.stdout).toBe(0);
  const line = child.stdout.split("\n").find(value => value.startsWith("PAID_OPERATOR_NATIVE "));
  expect(line, child.stdout).toBeTruthy();
  expect(JSON.parse(line!.slice("PAID_OPERATOR_NATIVE ".length))).toEqual({
    scenario, actualNativeCoreAndAuth: true, actualOperatorRefresh: true, syntheticProviderFacts: true,
    realNetwork: 0, actualStageQualified: false,
  });
}, 35_000);


const imports = `
import {PartnerAlertAdmission} from "@/src/modules/partner-alerts/server/partner-alert-admission";
import {PartnerAlertRequestWriter} from "@/src/modules/partner-alerts/server/partner-alert-request-writer";
import {PlatformDiscordMembershipRepository} from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import {refreshPartnerAlertOperatorEvidence} from "@/src/modules/partner-alerts/server/partner-alert-operator-evidence-refresh";
`;
const exercise = `
 {
 const scenario=process.argv[3];assert.equal(scenario,"operator-refresh");
 PartnerAlertAdmission.bind(db);
 new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,
  grantedByKind:"bootstrap_console",grantedByUserId:null,grantReceiptSha256:hash("SYNTHETIC_OPERATOR"),recoveryOfGrantId:null,grantedAtUtc:clock});
 const membership=new PlatformDiscordMembershipRepository(db);
 const grants=JSON.stringify(db.prepare("SELECT * FROM platform_operator_grants ORDER BY operator_grant_id").all());
 const lifecycles=JSON.stringify(db.prepare("SELECT * FROM platform_erasure_lifecycles ORDER BY lifecycle_ref").all());
 const req=new Request("https://synthetic.example.com/api/admin/journal/partner-channels",{headers:{host:"synthetic.example.com",
  cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token}});
 const writer=new PartnerAlertRequestWriter(db,{environment:process.env,now:()=>new Date(),createId:randomUUID,
  destinationGuildId:guildId,maximumActorAgeMs:30000,maximumDiscordEvidenceAgeMs:300000,
  outputBotUserId:"12349",outputConfigurationRef:"synthetic_output",stripeEnvironment:"sandbox",whopEnvironment:"sandbox"});
 assert.throws(()=>writer.run(req,scope=>scope.listReviewRequests(100)));
 let observed=0;
 const outcome=await refreshPartnerAlertOperatorEvidence({database:db,admission:core,request:req,environment:process.env,
  botToken:"synthetic-provider-token",configurationIsCurrent:()=>true,transport:async(url)=>{
   assert.equal(db.inTransaction,false);observed++;
   const target=String(url);assert(target.startsWith("https://discord.com/api/v10/guilds/"+guildId));
   return target.includes("/members/")?Response.json({user:{id:"12345",username:"observed-native-owner"},roles:[],joined_at:null})
    :Response.json({id:guildId,name:"Synthetic Main guild",owner_id:"12345"});
  }});
 assert.equal(outcome,"verified");assert.equal(observed,2);
 assert.deepEqual(writer.run(req,scope=>scope.listReviewRequests(100)),[]);
 assert.equal(membership.findCurrent(actor.userId,guildId)!.username,"observed-native-owner");
 assert.equal(JSON.stringify(db.prepare("SELECT * FROM platform_operator_grants ORDER BY operator_grant_id").all()),grants);
 assert.equal(JSON.stringify(db.prepare("SELECT * FROM platform_erasure_lifecycles ORDER BY lifecycle_ref").all()),lifecycles);
 assert.equal(db.prepare("SELECT count(*) n FROM partner_alert_role_jobs").get().n,0);
 assert.equal(networkRequests,0);db.close();
 console.log("PAID_OPERATOR_NATIVE "+JSON.stringify({scenario,actualNativeCoreAndAuth:true,actualOperatorRefresh:true,
  syntheticProviderFacts:true,realNetwork:0,actualStageQualified:false}));
 }
`;
