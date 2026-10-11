import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { readCoachingDeletionArchive } from "@/src/modules/communities/server/coaching-deletion-archive";

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, context: { params: Promise<{ archiveId: string }> }) {
  try {
    const { archiveId } = await context.params;
    return withJournalAdminDatabase(request.headers, (database) => {
      const now = new Date().toISOString();
      const pageValue=new URL(request.url).searchParams.get('page')??'0';
      if(!/^\d{1,6}$/.test(pageValue))return Response.json({error:'Invalid page.'},{status:400,headers:privateHeaders});
      const archive = readCoachingDeletionArchive(database, archiveId, now,Number(pageValue));
      if (!archive) return Response.json({ error: "Archive unavailable." }, { status: 404, headers: privateHeaders });
      const attachmentId = new URL(request.url).searchParams.get("attachment");
      if (!attachmentId) return Response.json(archive, { headers: privateHeaders });
      const file = database.prepare(`SELECT f.content,f.media_type FROM community_deletion_archive_files f
        JOIN community_deletion_archives a ON a.archive_id=f.archive_id
        WHERE f.archive_id=? AND f.attachment_id=? AND a.expires_at_utc>?`)
        .get(archiveId, attachmentId, now) as { content: Buffer; media_type: string } | undefined;
      if (!file) return Response.json({ error: "Attachment unavailable." }, { status: 404, headers: privateHeaders });
      return new Response(new Uint8Array(file.content), { headers: {
        ...privateHeaders, "Content-Type": file.media_type, "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      } });
    });
  } catch {
    return Response.json({ error: "Archive unavailable." }, { status: 403, headers: privateHeaders });
  }
}
