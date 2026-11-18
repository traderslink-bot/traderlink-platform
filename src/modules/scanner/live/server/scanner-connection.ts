import 'server-only';
import {readSharedMoomooConnectionStatus} from '@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge';
import {dirname,join} from 'node:path';
import {resolvePlatformDatabaseConfig} from '@/src/modules/platform/server/database/platform-database-config';
import {readScannerConnection} from './provider-store';
/** Read-only provider description does not instantiate a feed, audit writer or connection. */
export function scannerConnection(environment:NodeJS.ProcessEnv=process.env){
 const directory=join(dirname(resolvePlatformDatabaseConfig({environment}).databasePath),'scanner-live-v1');
 let moomooAvailable=false;
 try{moomooAvailable=readSharedMoomooConnectionStatus(environment).ready;}catch{/* Preserve Alpaca access while the alternate connection is unavailable. */}
 return {...readScannerConnection(directory,{...environment,TRADERLINK_MARKET_DATA_PROVIDER:'alpaca'}),moomooAvailable};
}
