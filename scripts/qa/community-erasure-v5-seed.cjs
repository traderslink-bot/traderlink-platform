const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');

module.exports = function seedStripeBuyer(db, { buyerId, publisherId, discordUserId, sourceGuildId, atUtc }) {
  const communityId = randomUUID(), mappingId = randomUUID(), offerId = randomUUID();
  const guildId = '1559172784813514803', roleId = '810000000000000253', channelId = '810000000000000254';
  const sourceChannelId = '810000000000000255', botUserId = '810000000000000256', botRole = '810000000000000257';
  const sentinel = '810000000000000258', premium = '810000000000000259';
  assert.notEqual(buyerId,publisherId);
  const write = (sql, ...params) => db.prepare(sql).run(...params);
  db.transaction(() => {
    write('INSERT INTO traderlink_communities VALUES(?,?,?,?,'+"'active'"+',?,?,?)',
      communityId,sourceGuildId,'stripe-core-qa','Fixture Publisher',publisherId,atUtc,atUtc);
    write(`INSERT INTO partner_alert_partners(community_id,owner_user_id,source_guild_id,display_name,
      content_policy_json,status,revision,created_at_utc,updated_at_utc)
      VALUES(?,?,?,'Fixture Publisher','{}','active',1,?,?)`,communityId,publisherId,sourceGuildId,atUtc,atUtc);
    write(`INSERT INTO partner_alert_mappings(mapping_id,community_id,source_guild_id,source_channel_id,display_name,
      destination_guild_id,destination_channel_id,destination_role_id,revision,review_state,approved_revision,ever_approved,
      delivery_state,created_at_utc,updated_at_utc)
      VALUES(?,?,?,?,'Fixture Alerts',?,?,?,1,'approved',1,1,'ready',?,?)`,
      mappingId,communityId,sourceGuildId,sourceChannelId,guildId,channelId,roleId,atUtc,atUtc);
    write(`INSERT INTO partner_alert_offers(offer_id,community_id,version,kind,offer_json,whop_environment,
      whop_account_id,whop_product_id,whop_plan_id,review_state,created_at_utc)
      VALUES(?,?,1,'channel',?,NULL,NULL,NULL,NULL,'draft',?)`,
      offerId,communityId,JSON.stringify({billingProvider:"stripe",amountMinor:2500,currency:{code:'USD'},mappingIds:[mappingId]}),atUtc);
    write('INSERT INTO partner_alert_offer_channels VALUES(?,?,1,?)',communityId,offerId,mappingId);
    write("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=?",offerId);
    const now = Date.parse(atUtc);
    write("INSERT INTO partner_alert_stripe_sellers VALUES('seller_coreqa',?,?,'sandbox','acct_coreqa','ready',?,?,NULL)",communityId,publisherId,now,now);
    write("INSERT INTO partner_alert_stripe_prices VALUES('seller_coreqa',?,'sandbox','acct_coreqa',?,1,'price_coreqa','usd',2500,?,NULL)",communityId,offerId,now);
    write(`INSERT INTO partner_alert_stripe_checkout_claims
      (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,
       stripe_session_id,stripe_customer_id,stripe_subscription_id,created_at_ms,checkout_closed_at_ms,checkout_close_reason) VALUES('claim_coreqa',?,'seller_coreqa',?,'sandbox',
      'acct_coreqa',?,1,'price_coreqa','cs_test_coreqa','cus_coreqa','sub_coreqa',?,NULL,NULL)`,buyerId,communityId,offerId,now);
    const sha = createHash('sha256').update('synthetic payment test').digest('hex');
    write(`INSERT INTO partner_alert_stripe_events VALUES('sandbox','acct_coreqa','evt_coreqa','seller_coreqa',?,
      'claim_coreqa','invoice.paid','in_coreqa',?,?,'applied')`,communityId,sha,now);
    write(`INSERT INTO partner_alert_stripe_paid_terms VALUES('sandbox','acct_coreqa','claim_coreqa','in_coreqa',
      'inpay_coreqa','pi_coreqa','evt_coreqa',?,?,2500,'usd')`,now,now+3600000);
    write(`INSERT INTO partner_alert_stripe_role_reconciliations VALUES('role_coreqa','sandbox','acct_coreqa','evt_coreqa',
      'claim_coreqa',?,?,?,1,'applied',?)`,communityId,buyerId,mappingId,now);
  }).immediate();
  const writeRequests = [];
  const memberRoles = new Set([roleId,sentinel,premium]);
  const roles = [
    {id:guildId,position:0,permissions:'0',managed:false},
    {id:botRole,position:10,permissions:'268435456',managed:false},
    {id:roleId,position:1,permissions:'0',managed:false},
    {id:sentinel,position:1,permissions:'0',managed:false},
    {id:premium,position:1,permissions:'0',managed:false},
  ];
  const discordFetch = async (value, init) => {
    assert.equal(db.inTransaction,false);
    const url = new URL(value);
    assert.equal(url.origin,'https://discord.com');
    const path = url.pathname.replace(/^\/api\/v10/,'');
    const prefix = '/guilds/'+guildId;
    if (init.method==='DELETE') {
      assert.equal(path,prefix+'/members/'+discordUserId+'/roles/'+roleId);
      writeRequests.push(path);
      memberRoles.delete(roleId);
      return new Response(null,{status:204});
    }
    assert.equal(init.method,'GET');
    if (path==='/users/@me') return Response.json({id:botUserId,bot:true});
    if (path===prefix+'/roles') return Response.json(roles);
    if (path===prefix+'/channels') return Response.json([{id:channelId,guild_id:guildId,permission_overwrites:[]}]);
    if (path===prefix+'/members/'+botUserId) return Response.json({user:{id:botUserId,bot:true},roles:[botRole]});
    if (path===prefix+'/members/'+discordUserId) return Response.json({user:{id:discordUserId,bot:false},roles:[...memberRoles]});
    throw new Error('Unexpected private Discord fixture request.');
  };
  return Object.freeze({ communityId,mappingId,offerId,guildId,roleId,channelId,discordUserId,memberRoles,writeRequests,discordFetch,
    forbiddenRoleIds:[sentinel,premium],providerConfiguration:{discordBotUserId:botUserId,discordBotToken:'synthetic-test-token-only',
      outputBindings:[{communityId,sourceGuildId,sourceChannelId,destinationGuildId:guildId,destinationChannelId:channelId,destinationRoleId:roleId}]},
  });
};
