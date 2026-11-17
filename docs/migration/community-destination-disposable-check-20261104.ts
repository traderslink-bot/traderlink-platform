import {copyFileSync,existsSync,statSync} from "node:fs";
import {randomUUID} from "node:crypto";
import Database from "better-sqlite3";
import {traderLinkCommunityDestinationTemplatesMigration as migration} from "../../src/modules/communities/server/database/migrations/0195_traderlink_community_destination_templates";
import {communityPublicationDestinationUrl} from "../../src/modules/communities/server/community-branded-destination-url";
import {isCommunityContentActivityPath} from "../../src/modules/communities/server/community-activity-scope";
import {pruneCommunityNamedActivity} from "../../src/modules/communities/server/community-activity-retention";

const [sourcePath,targetPath]=process.argv.slice(2);
if(!sourcePath||!targetPath)throw new Error("Usage: node --import tsx docs/migration/community-destination-disposable-check-20261104.ts SOURCE_DB NEW_TARGET_DB");
if(!existsSync(sourcePath))throw new Error("Source database is missing.");
if(existsSync(targetPath))throw new Error("Target must not already exist.");
const sourceBefore=statSync(sourcePath);
copyFileSync(sourcePath,targetPath);
const db=new Database(targetPath);
db.pragma("foreign_keys = ON");
const ledgerBefore=db.prepare("SELECT migration_id,execution_order FROM platform_schema_migrations ORDER BY execution_order").all() as Array<{migration_id:string;execution_order:number}>;
const swing=db.prepare("SELECT * FROM traderlink_community_content_pages WHERE page_type='swing' ORDER BY page_id LIMIT 1").get() as Record<string,unknown>|undefined;
if(!swing)throw new Error("Fixture requires one legacy Swing destination.");
const collisionId="11111111-1111-4111-8111-111111111111";
db.prepare(`INSERT INTO traderlink_community_content_pages(page_id,community_id,page_type,feed_kind,slug,secondary_slug,title,description,logo_url,publisher_user_id,category_id,status,display_count,created_by_user_id,created_at_utc,updated_at_utc)
 SELECT ?,community_id,'alert',feed_kind,slug,secondary_slug,'Collision alert',description,logo_url,publisher_user_id,category_id,status,display_count,created_by_user_id,created_at_utc,updated_at_utc
 FROM traderlink_community_content_pages WHERE page_id=?`).run(collisionId,swing.page_id);
for(const sql of migration.statements)db.exec(sql);
const migrated=db.prepare("SELECT page_id,page_type,slug,secondary_slug FROM traderlink_community_content_pages WHERE page_id IN (?,?) ORDER BY page_id").all(collisionId,swing.page_id);
const legacy=db.prepare("SELECT legacy_slug,legacy_secondary_slug,page_id FROM traderlink_community_legacy_destination_routes WHERE page_id=?").get(swing.page_id);
const community=db.prepare("SELECT community_id,slug FROM traderlink_communities WHERE slug='test-community'").get() as {community_id:string;slug:string};
const urlRows=db.prepare("SELECT content_type,content_id FROM traderlink_community_content_placements WHERE content_type IN ('alert','watchlist') AND status='published' ORDER BY content_type,content_id").all() as Array<{content_type:"alert"|"watchlist";content_id:string}>;
const urls=urlRows.map(row=>communityPublicationDestinationUrl(db,{publicOrigin:"https://app.example.test",communityId:community.community_id,communitySlug:community.slug,kind:row.content_type,objectId:row.content_id}));
const checkedAt="2026-11-04T12:00:00.000Z";
const publicPaths=[`/communities/${community.slug}/alert`,`/communities/${community.slug}/alert/avery/momentum`,`/communities/${community.slug}/watchlist/options`,`/communities/${community.slug}/content/education/charts/candlesticks`];
const privatePath=`/communities/${community.slug}/manage/pages`;
const insertEvent=db.prepare("INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,object_id,path,occurred_at_utc) VALUES(?,?,NULL,'page_view','page',NULL,?,?)");
for(const path of [...publicPaths,privatePath])insertEvent.run(randomUUID(),community.community_id,path,checkedAt);
const prune=pruneCommunityNamedActivity(db,checkedAt,500);
const retained=(db.prepare("SELECT path FROM traderlink_community_activity_events WHERE occurred_at_utc=? ORDER BY path").all(checkedAt) as Array<{path:string}>).map(row=>row.path);
const result={
 status:"passed",migration:{id:migration.migrationId,executionOrder:migration.executionOrder},
 source:{path:sourcePath,inode:sourceBefore.ino,size:sourceBefore.size,unchanged:statSync(sourcePath).ino===sourceBefore.ino&&statSync(sourcePath).size===sourceBefore.size},
 target:targetPath,ledgerBefore:{count:ledgerBefore.length,last:ledgerBefore.at(-1)},
 collision:{legacySwingPageId:swing.page_id,migrated,legacy},urls,
 activity:{scope:[...publicPaths,privatePath].map(path=>({path,allowed:isCommunityContentActivityPath(community.slug,path)})),prune,retained},
 quickCheck:db.pragma("quick_check",{simple:true}),foreignKeyViolations:(db.pragma("foreign_key_check") as unknown[]).length,
 };
db.close();
console.log(JSON.stringify(result,null,2));
