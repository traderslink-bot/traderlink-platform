'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { rebindProfileSchema } = require('../platform/combined-210-native-profile-setup-20261119.cjs');

const oldSchema = '9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89';
const targetSchema = 'e2b148f268e6ca409263612d1bc3b3457955db2e6ef07c390c3ba8a45e063016';
const nowUtc = '2026-11-24T08:00:00.000Z';
const command = {
  profileRef: 'community_account_erasure_210_v1',
  expectedGeneration: 1,
  retentionPolicyRef: 'paid_partner_retention_7d_v2',
  backupPolicyRef: 'paid_partner_restore_safety_v2',
  validUntilUtc: '2027-11-19T05:14:42.950Z',
};

function fixture(t) {
  const database = new Database(':memory:');
  t.after(() => database.close());
  database.exec(`
    CREATE TABLE platform_erasure_profiles (
      profile_ref TEXT PRIMARY KEY, generation INTEGER NOT NULL, schema_sha256 TEXT NOT NULL,
      retention_policy_ref TEXT NOT NULL, backup_policy_ref TEXT NOT NULL,
      reference_policy TEXT NOT NULL, valid_until_utc TEXT NOT NULL
    ) STRICT;
    CREATE TABLE platform_erasure_lifecycles (
      lifecycle_ref TEXT PRIMARY KEY, phase TEXT NOT NULL, profile_generation INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE platform_erasure_module_operations (
      operation_ref TEXT PRIMARY KEY, phase TEXT NOT NULL, profile_generation INTEGER NOT NULL
    ) STRICT;
    INSERT INTO platform_erasure_lifecycles VALUES ('first','live',1),('second','live',1),('third','settling',1);
    INSERT INTO platform_erasure_module_operations VALUES ('unsettled','ready',1);
  `);
  database.prepare('INSERT INTO platform_erasure_profiles VALUES (?,?,?,?,?,?,?)').run(
    command.profileRef, 1, oldSchema, command.retentionPolicyRef, command.backupPolicyRef,
    'hold_signer_and_shared_owner', command.validUntilUtc,
  );
  return database;
}

test('only the profile schema changes, keeping live and incomplete erasures bound to generation one', t => {
  const database = fixture(t);
  const profile = () => database.prepare('SELECT * FROM platform_erasure_profiles').get();
  const lifecycles = () => database.prepare('SELECT * FROM platform_erasure_lifecycles ORDER BY lifecycle_ref').all();
  const operations = () => database.prepare('SELECT * FROM platform_erasure_module_operations').all();
  const before = { profile: profile(), lifecycles: lifecycles(), operations: operations() };
  database.transaction(() => rebindProfileSchema(database, command, targetSchema, nowUtc)).immediate();
  assert.deepEqual(profile(), { ...before.profile, schema_sha256: targetSchema });
  assert.deepEqual(lifecycles(), before.lifecycles);
  assert.deepEqual(operations(), before.operations);
  assert.throws(database.transaction(() => rebindProfileSchema(database, command, targetSchema, nowUtc)), /changed/u);
});

test('wrong policy, expiry, source schema and generation leave the profile unchanged', t => {
  const database = fixture(t);
  const apply = database.transaction((input, schema, now) => rebindProfileSchema(database, input, schema, now));
  assert.throws(() => rebindProfileSchema(database, command, targetSchema, nowUtc), /audit transaction/u);
  assert.throws(() => apply({ ...command, expectedGeneration: 2 }, targetSchema, nowUtc), /unexpected existing profile generation/u);
  assert.throws(() => apply({ ...command, retentionPolicyRef: 'different_policy' }, targetSchema, nowUtc));
  assert.throws(() => apply({ ...command, validUntilUtc: '2028-01-01T00:00:00.000Z' }, targetSchema, nowUtc));
  assert.throws(() => apply(command, oldSchema, nowUtc));
  assert.throws(() => apply(command, targetSchema, command.validUntilUtc));
  assert.equal(database.prepare('SELECT schema_sha256 FROM platform_erasure_profiles').get().schema_sha256, oldSchema);
});
