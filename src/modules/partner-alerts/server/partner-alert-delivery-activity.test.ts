// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { readPartnerAlertDeliveryActivity } from "./partner-alert-delivery-activity";

it("projects current delivery metadata and refuses text once its first receipt is seven days old", () => {
  const db = new Database(":memory:");
  try {
    db.exec(`CREATE TABLE partner_alert_source_messages(community_id TEXT,source_guild_id TEXT,source_channel_id TEXT,
      message_id TEXT,revision INTEGER,state TEXT,retain_until_utc TEXT,text_content TEXT);
      CREATE TABLE partner_alert_source_revisions(community_id TEXT,source_channel_id TEXT,message_id TEXT,
        revision INTEGER,state TEXT,hold_issues_json TEXT,observed_at_utc TEXT);
      CREATE TABLE partner_alert_mappings(community_id TEXT,source_guild_id TEXT,source_channel_id TEXT,mapping_id TEXT,
        display_name TEXT,ever_approved INTEGER,activated_at_utc TEXT);
      CREATE TABLE partner_alert_deliveries(community_id TEXT,mapping_id TEXT,source_channel_id TEXT,message_id TEXT,
        source_revision INTEGER,status TEXT,action TEXT,last_error_code TEXT);
      INSERT INTO partner_alert_mappings VALUES('publisher','10','20','mapping','Approved alerts',1,'2026-11-01T00:00:00.000Z'),
        ('publisher','10','21','draft','Draft channel',0,NULL),('unrelated','11','22','other','Unrelated alerts',1,'2026-11-01T00:00:00.000Z');
      INSERT INTO partner_alert_source_messages VALUES ('publisher','10','20','29',2,'allowed','9999-12-31T23:59:59.999Z','edited body'),
        ('publisher','10','20','30',1,'held','2026-11-16T12:00:00.000Z','held body'),
        ('publisher','10','21','31',1,'allowed','2026-11-16T12:00:00.000Z','draft body'),
        ('unrelated','11','22','32',1,'allowed','2026-11-16T12:00:00.000Z','unrelated body');
      INSERT INTO partner_alert_source_revisions VALUES ('publisher','20','29',1,'allowed','[]','2026-11-01T12:00:00.000Z'),
        ('publisher','20','29',2,'allowed','[]','2026-11-07T12:00:00.000Z'),
        ('publisher','20','30',1,'held','["link_or_invite","unknown_rule"]','2026-11-07T12:00:00.000Z'),
        ('publisher','21','31',1,'allowed','[]','2026-11-07T12:00:00.000Z'),
        ('unrelated','22','32',1,'allowed','[]','2026-11-07T12:00:00.000Z');
      INSERT INTO partner_alert_deliveries VALUES ('publisher','mapping','20','29',1,'delivered','create',NULL),
        ('publisher','mapping','20','29',2,'delivered','edit',NULL),('publisher','mapping','20','29',2,'uncertain','edit','outcome_unknown');`);
    const read = (id: string | null, time = "2026-11-08T12:00:00.000Z") => readPartnerAlertDeliveryActivity(db,"publisher",id,time);
    const list = read(null);
    expect(list).toEqual({ alerts: [
      { messageId: "30", channelName: "Approved alerts", receivedAtUtc: "2026-11-07T12:00:00.000Z",
        delivery: "held", textState: "available", holdReasons: ["This post contains a link or invite."] },
      { messageId: "29", channelName: "Approved alerts", receivedAtUtc: "2026-11-01T12:00:00.000Z",
        delivery: "uncertain", textState: "expired", holdReasons: [] },
    ], openedText: null });
    expect(read("29","2026-11-08T11:59:59.999Z").openedText).toEqual({ body: "edited body", remainingMs: 1 });
    expect(read("29").openedText).toBeNull();
    expect(read("30").openedText?.body).toBe("held body");
    expect(read("31")).toEqual({ alerts: [], openedText: null });
    expect(read("32")).toEqual({ alerts: [], openedText: null });
  } finally { db.close(); }
});
