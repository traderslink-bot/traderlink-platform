// Real-schema quota proof using inert synthetic ledger entries; never runs a worker.
const assert = require('node:assert/strict'), crypto = require('node:crypto');
module.exports = function verifyAnalyzerUsage(db, userA, userB, readAllowance) {
  const account = db.prepare('SELECT workspace_id,account_id FROM journal_accounts WHERE created_by_user_id=?').get(userA);
  assert(account, 'Synthetic Journal account required');
  const now = new Date(), at = now.toISOString(), day = at.slice(0, 10);
  const later = new Date(now.getTime() + 60000).toISOString();
  const earlier = new Date(now.getTime() - 60000).toISOString();
  const ids = [], cycle = crypto.randomUUID(), market = crypto.randomUUID();
  assert.equal(readAllowance(db, userA, 'trade_analyzer.analyses', now).remaining, 12);
  db.transaction(() => {
    db.prepare(`INSERT INTO level_analysis_market_session_sets
      (market_session_set_id,provider_key,provider_adapter_version,provider_symbol,exchange_identity,
       trading_date_new_york,interval,session_policy,current_status,created_at_utc,updated_at_utc)
      VALUES (?,'yahoo_chart','yahoo_chart_v1','QAONLY','synthetic',?,'1m',
       'america_new_york_extended_0400_2000_v1','provider_unavailable',?,?)`).run(market,day,at,at);
    db.prepare(`INSERT INTO level_analysis_user_allowance_cycles
      (allowance_cycle_id,user_id,starts_on_new_york_date,ends_on_new_york_date,created_at_utc)
      VALUES (?,?,?,?,?)`).run(cycle,userA,day,day,at);
    for (const kind of ['consumed','consumed','consumed','active','expired','waived']) {
      const trade=crypto.randomUUID(), version=crypto.randomUUID(), job=crypto.randomUUID(), reservation=crypto.randomUUID();
      db.prepare(`INSERT INTO journal_logical_trades VALUES (?,?,?,?,'retired',1,?,?)`)
        .run(trade,account.workspace_id,account.account_id,version,at,at);
      db.prepare(`INSERT INTO journal_logical_trade_versions
        (logical_trade_version_id,workspace_id,account_id,logical_trade_id,version_number,version_state,
         trade_style,change_kind,created_by_user_id,created_at_utc)
        VALUES (?,?,?,?,1,'retired','day','created',?,?)`)
        .run(version,account.workspace_id,account.account_id,trade,userA,at);
      db.prepare(`INSERT INTO level_analysis_logical_trade_jobs
        (logical_trade_job_id,user_id,workspace_id,account_id,logical_trade_id,logical_trade_version_id,
         market_session_set_id,desired_coverage_end_utc,next_attempt_at_utc,status,attempt_count,created_at_utc,updated_at_utc)
        VALUES (?,?,?,?,?,?,?,?,?,'expired',0,?,?)`)
        .run(job,userA,account.workspace_id,account.account_id,trade,version,market,at,at,at,at);
      db.prepare(`INSERT INTO level_analysis_analyzer_reservations VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(reservation,userA,job,cycle,day,kind==='active'||kind==='expired'?'active':'consumed',
          kind==='waived'?1:0,kind==='expired'?earlier:later,at,at);
      if(kind==='consumed') db.prepare(`INSERT INTO level_analysis_analyzer_acquisitions
        (acquisition_id,market_session_set_id,charged_user_id,reservation_id,charge_kind,started_at_utc,completed_at_utc,outcome)
        VALUES (?,?,?,?,'user_charged',?,?,'no_coverage')`).run(crypto.randomUUID(),market,userA,reservation,at,at);
      ids.push({kind,reservation});
    }
  })();
  assert.equal(readAllowance(db,userA,'trade_analyzer.analyses',now).remaining,8);
  assert.equal(readAllowance(db,userB,'trade_analyzer.analyses',now).remaining,12);
  assert.equal(readAllowance(db,userA,'trade_analyzer.analyses',now,ids.find(x=>x.kind==='active').reservation).remaining,9);
  assert.equal(readAllowance(db,userA,'trade_analyzer.analyses',new Date(Date.parse(later)+1)).remaining,9);
  assert.equal(db.pragma('foreign_key_check').length,0);
  return {status:'PASS',consumed:3,reserved:1,expiredIgnored:1,waivedIgnored:1,crossUserIsolation:true};
};
