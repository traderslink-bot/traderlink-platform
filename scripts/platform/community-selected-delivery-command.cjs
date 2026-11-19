'use strict';
const {readSelectedCommunityDeliveryCase,runSelectedCommunityDeliveryCommand,selectedCommunityDeliveryPrincipalWitness}=require('../../src/modules/communities/server/community-selected-delivery-command');
const {readSelectedSharedAlertSourceOriginal}=require('../../src/modules/communities/server/shared-alerts-selected-source-original');
const {readSelectedCommunityPlanDelivery}=require('../../src/modules/communities/server/community-selected-plan-delivery');
async function main(){
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--case-file'||args[2]!=='--case-sha256')throw Error('Expected --case-file PATH --case-sha256 SHA256');
  const input=readSelectedCommunityDeliveryCase(args[1],args[3]);
  const result=await runSelectedCommunityDeliveryCommand(input);
  process.stdout.write(JSON.stringify(result)+'\n');
  const counts=result.result.counts||result.result;
  if(counts.failed>0)process.exitCode=2;
}
module.exports={readSelectedCommunityDeliveryCase,runSelectedCommunityDeliveryCommand,selectedCommunityDeliveryPrincipalWitness,readSelectedSharedAlertSourceOriginal,readSelectedCommunityPlanDelivery};
if(require.main===module)main().catch(()=>{process.stderr.write('Selected delivery stopped; reconcile the exact job and receipts before any retry.\n');process.exitCode=1;});
