import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {platformMigrationManifest} from '@/src/modules/platform/server/database/platform-migration-manifest';
import {calculatePlatformMigrationChecksum} from '@/src/modules/platform/server/database/platform-migration-contract';

export type PristinePlatformSnapshot={base64:string;sha256:string;schemaSha256:string;descriptorSha256:string;sqliteVersion:string};
export function platformTestDescriptorSha256():string{
 return createHash('sha256').update(JSON.stringify(platformMigrationManifest.map(m=>({id:m.migrationId,namespace:m.moduleNamespace,order:m.executionOrder,checksum:calculatePlatformMigrationChecksum(m)})))).digest('hex');
}

export function decodePlatformTestSnapshot(snapshot:PristinePlatformSnapshot):Buffer{
 assert.equal(snapshot.descriptorSha256,platformTestDescriptorSha256(),'Test snapshot manifest changed');
 const value=Buffer.from(snapshot.base64,'base64');
 assert.equal(createHash('sha256').update(value).digest('hex'),snapshot.sha256,'Test snapshot bytes changed');
 return value;
}
