import 'server-only';
import {constants,openSync,fstatSync,readFileSync,closeSync} from 'node:fs';
import {mkdir,lstat,open,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export type ScannerProvider='alpaca'|'moomoo';
export type ScannerConnection={provider:ScannerProvider;revision:number};
export function readScannerConnection(directory:string,environment:NodeJS.ProcessEnv):ScannerConnection{
  let handle:number;
  try{handle=openSync(join(directory,'provider.json'),constants.O_RDONLY|constants.O_NOFOLLOW);}
  catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {provider:environment.TRADERLINK_MARKET_DATA_PROVIDER==='moomoo'?'moomoo':'alpaca',revision:0};throw error;}
  try{
    const stat=fstatSync(handle);if(!stat.isFile()||stat.size>1024)throw Error('invalid_scanner_connection');
    const value=JSON.parse(readFileSync(handle,'utf8')) as ScannerConnection;
    if(!['alpaca','moomoo'].includes(value.provider)||!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('invalid_scanner_connection');return value;
  }finally{closeSync(handle);}
}
export async function saveScannerConnection(directory:string,current:ScannerConnection,provider:ScannerProvider){
  if(!['alpaca','moomoo'].includes(provider)||!Number.isSafeInteger(current.revision)||current.revision<0||current.revision>=Number.MAX_SAFE_INTEGER)throw Error('invalid_scanner_connection');
  await mkdir(directory,{recursive:true,mode:0o700});const folderInfo=await lstat(directory);if(!folderInfo.isDirectory()||folderInfo.isSymbolicLink())throw Error('invalid_scanner_connection');const target=join(directory,'provider.json'),temporary=target+'.'+randomUUID()+'.tmp';
  const value={provider,revision:current.revision+1};
  try{const file=await open(temporary,'wx',0o600);try{await file.writeFile(JSON.stringify(value)+'\n');await file.sync();}finally{await file.close();}await rename(temporary,target);const folder=await open(directory,constants.O_RDONLY|constants.O_DIRECTORY);try{await folder.sync();}finally{await folder.close();}}finally{await unlink(temporary).catch(()=>{});}
  return value;
}
