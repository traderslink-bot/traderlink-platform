// @vitest-environment node
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {expect,it} from 'vitest';
import {readScannerConnection,saveScannerConnection} from './provider-store';
it('defaults to Alpaca and privately persists an explicit provider without changing the environment',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'scanner-provider-test-'));const environment:NodeJS.ProcessEnv={NODE_ENV:'test'};
 try{const initial=readScannerConnection(directory,environment);expect(initial).toEqual({provider:'alpaca',revision:0});await saveScannerConnection(directory,initial,'moomoo');expect(readScannerConnection(directory,{...environment,TRADERLINK_MARKET_DATA_PROVIDER:'alpaca'})).toEqual({provider:'moomoo',revision:1});expect((await stat(join(directory,'provider.json'))).mode&0o777).toBe(0o600);expect(environment).toEqual({NODE_ENV:'test'});}finally{await rm(directory,{recursive:true,force:true});}
});
