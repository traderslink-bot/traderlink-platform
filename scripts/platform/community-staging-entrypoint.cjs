'use strict';
// This wrapper is copied only by the explicit isolated-staging Dockerfile.
// The bundled initializer validates the immutable worker-mode boundary before opening a DB.
const plan=require('./community-staging-release-plan.json');
require('./community-staging/bootstrap.cjs').bootstrapIsolatedCommunityStaging(plan);
console.log(JSON.stringify({stage:'isolated_community_staging_ready',source:plan.sourceCommit,schema:plan.schemaSha256,migrationCount:plan.ledger.length}));
require('./application-server.js');
