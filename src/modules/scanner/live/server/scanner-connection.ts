import 'server-only';
import {dirname,join} from 'node:path';
import {resolvePlatformDatabaseConfig} from '@/src/modules/platform/server/database/platform-database-config';
import {readScannerConnection} from './provider-store';
/** Read-only provider description does not instantiate a feed, audit writer or connection. */
export function scannerConnection(environment:NodeJS.ProcessEnv=process.env){
 const directory=join(dirname(resolvePlatformDatabaseConfig({environment}).databasePath),'scanner-live-v1');
 return {...readScannerConnection(directory,environment),moomooAvailable:environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED==='true'};
}
