import type { Metadata } from "next";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { readSwingVisits, readSwingActivityClock } from "@/src/modules/swings/server/swing-idea-visits";
import { SWING_IDEA } from "@/src/modules/swings/swing-idea-catalog";
import { JournalAdminPage } from "../journal-admin-ui";
import styles from "./swing-activity.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {title:"Swing Idea Activity | Journal Administration"};
const time = (n:number) => new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"medium"}).format(n);
const day = (n:number) => new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(n);
function start(date:string):number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) return NaN;
  const utc=Date.parse(`${date}T00:00:00Z`);
  if (new Date(utc).toISOString().slice(0,10)!==date) return NaN;
  const offset=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",timeZoneName:"shortOffset"}).formatToParts(utc+5*3600000).find(p=>p.type==="timeZoneName")?.value;
  return utc + (offset==="GMT-4"?4:5)*3600000;
}
const hint=(title:string,text:string)=><Tooltip title={text}><span tabIndex={0}>{title} ⓘ</span></Tooltip>;
export default async function SwingActivityPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const p=await searchParams;const value=(key:string)=>typeof p[key]==="string"?p[key] as string:"";
  const now=readSwingActivityClock();
  const fromDate=value("from")||day(now-6*86400000),untilDate=value("until")||day(now);
  const from=start(fromDate),endBase=Date.parse(`${untilDate}T12:00:00Z`);
  const nextDay=Number.isFinite(endBase)?new Date(endBase+86400000).toISOString().slice(0,10):"";
  const until=start(nextDay);const member=value("member").trim().slice(0,100);
  const outcome=["full","locked"].includes(value("outcome"))?value("outcome"):"";
  const page=Math.min(100000,Math.max(0,Math.floor(Number(value("page"))||0)));
  const valid=Number.isFinite(from)&&Number.isFinite(start(untilDate))&&Number.isFinite(until)&&until>from;
  const data=await withJournalAdminPageDatabase(db=>valid?readSwingVisits(db,{from,until,member,outcome,page}):null);
  const href=(n:number)=>`?${new URLSearchParams({from:fromDate,until:untilDate,member,outcome,page:String(n)})}`;
  return <JournalAdminPage><Typography variant="h1">Swing Idea Activity</Typography>
    <form className={styles.filters}>
      <label>Idea<select name="idea" defaultValue={SWING_IDEA.id}><option value={SWING_IDEA.id}>CRML</option></select></label>
      <label>Member<input name="member" defaultValue={member} placeholder="Search member" maxLength={100}/></label>
      <label>From · ET<input type="date" name="from" defaultValue={fromDate} required/></label>
      <label>Through · ET<input type="date" name="until" defaultValue={untilDate} required/></label>
      <label>Viewed<select name="outcome" defaultValue={outcome}><option value="">All views</option><option value="full">Full idea</option><option value="locked">Locked preview</option></select></label>
      <button type="submit">Apply</button><Link href="?from=2026-09-20">All recorded dates</Link>
    </form>
    {!data?<p role="alert">Choose a valid start and end date.</p>:<>
      <div className={styles.metrics}><p>{hint("Recorded visits","Page openings recorded in this date range. Reloads and repeat visits count separately; this does not mean the entire idea was read.")}<strong>{data.totals.visits}</strong></p><p>Signed-in members<strong>{data.totals.members}</strong></p><p>Full idea<strong>{data.totals.full}</strong></p><p>Locked preview<strong>{data.totals.locked}</strong></p></div>
      <div className={styles.table}><table><caption>Members</caption><thead><tr><th>{hint("Member","The signed-in member who opened the page.")}</th><th>{hint("Visits","Recorded openings by this member within your selected filters.")}</th><th>{hint("First visit · ET","Their earliest visit within the selected date range, in Eastern time.")}</th><th>{hint("Latest visit · ET","Their most recent visit within the selected date range, in Eastern time.")}</th><th>{hint("Full idea","Visits when Premium research was available.")}</th><th>{hint("Locked preview","Visits when only the membership invitation was available.")}</th></tr></thead><tbody>{data.members.map((r,i)=><tr key={i}><td>{r.member}</td><td>{r.visits}</td><td>{time(r.first)}</td><td>{time(r.latest)}</td><td>{r.full}</td><td>{r.locked}</td></tr>)}{!data.members.length&&<tr><td colSpan={6}>No signed-in member visits in this selection.</td></tr>}</tbody></table></div>
      <div className={styles.table}><table><caption>Visit history</caption><thead><tr><th>Member</th><th>Date and time · ET</th><th>{hint("Viewed","Full idea means Premium content was available. Locked preview means only the membership invitation was available.")}</th><th>{hint("Version","The saved edition of the idea at the time of the visit.")}</th></tr></thead><tbody>{data.visits.map((r,i)=><tr key={i}><td>{r.member}</td><td>{time(r.visited_at_ms)}</td><td>{r.access_outcome==="full"?"Full idea":"Locked preview"}</td><td>{r.content_revision}</td></tr>)}{!data.visits.length&&<tr><td colSpan={4}>No recorded visits in this selection.</td></tr>}</tbody></table></div>
      <nav className={styles.filters} aria-label="Activity pages">{page>0&&<Link href={href(page-1)}>Previous</Link>}<span>Page {page+1} · up to 50 rows per table</span>{(data.totals.visits>(page+1)*50||data.totals.members>(page+1)*50)&&<Link href={href(page+1)}>Next</Link>}</nav>
      <p>Anonymous visits cannot identify a member. Anonymous and deleted-account records are available for 30 days; member history remains until the account is deleted. Blocked requests and offline visits may not be recorded.</p>
    </>}
  </JournalAdminPage>;
}
