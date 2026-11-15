import type Database from 'better-sqlite3';
/** Preparatory additive migration source. Coordinator assigns identity/order; importing never executes SQL. */
export const independentCoachingSelectionLifecycleStatements=Object.freeze([
 "ALTER TABLE traderlink_coaching_review_trades ADD COLUMN selection_state TEXT NOT NULL DEFAULT 'active' CHECK(selection_state IN ('active','removed'));",
 'ALTER TABLE traderlink_coaching_review_trades ADD COLUMN removed_at_utc TEXT;',
 'ALTER TABLE traderlink_coaching_review_trades ADD COLUMN removed_by_user_id TEXT REFERENCES platform_users(user_id);',
]);
export function independentSelectionLifecycleReady(db:Database.Database):boolean{return (db.prepare('PRAGMA table_info(traderlink_coaching_review_trades)').all() as {name:string}[]).some(column=>column.name==='selection_state');}
/** Compatibility until the separately coordinated additive migration is installed. */
export function independentActiveSelectionSql(db:Database.Database,alias=''):string{
 if(alias&&!/^[a-z_]+$/.test(alias))throw new Error('Invalid selection query.');
 return independentSelectionLifecycleReady(db)?`${alias?alias+'.':''}selection_state='active'`:'1=1';
}
