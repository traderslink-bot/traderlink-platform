import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {constants,openSync,closeSync,readFileSync,fstatSync,mkdirSync,lstatSync,writeFileSync,fsyncSync,renameSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {MAX_MULTIVIEW_BYTES,EMPTY_MULTIVIEW,parseChartMultiview,type ChartMultiview} from './chart-multiview';
export function chartPreferenceOwnerKey(user:string){if(!user)throw Error('invalid_owner');return createHash('sha256').update(user).digest('hex');}
function path(directory:string,user:string){return join(directory,chartPreferenceOwnerKey(user)+'.json');}
export function readChartMultiview(directory:string,user:string):{revision:number;layout:ChartMultiview}{
 try{const directoryInfo=lstatSync(directory);if(!directoryInfo.isDirectory()||directoryInfo.isSymbolicLink())throw Error('invalid_directory');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 let fd:number;try{fd=openSync(path(directory,user),constants.O_RDONLY|constants.O_NOFOLLOW);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {revision:0,layout:EMPTY_MULTIVIEW};throw e;}
 try{const stat=fstatSync(fd);if(!stat.isFile()||stat.size>MAX_MULTIVIEW_BYTES)throw Error('invalid_layout');const p=JSON.parse(readFileSync(fd,'utf8'));if(!Number.isSafeInteger(p.revision)||p.revision<1)throw Error('invalid_layout');return {revision:p.revision,layout:parseChartMultiview(p.layout)};}finally{closeSync(fd);}
}
export function writeChartMultiview(directory:string,user:string,revision:number,layout:unknown){
 const validated=parseChartMultiview(layout);mkdirSync(directory,{recursive:true,mode:0o700});const folder=lstatSync(directory);if(!folder.isDirectory()||folder.isSymbolicLink())throw Error('invalid_directory');
 const current=readChartMultiview(directory,user);if(!Number.isSafeInteger(revision)||revision>=Number.MAX_SAFE_INTEGER||revision!==current.revision)throw Error('layout_conflict');
 const result={revision:revision+1,layout:validated},target=path(directory,user),temporary=target+'.'+randomUUID()+'.tmp';
 try{const fd=openSync(temporary,'wx',0o600);try{writeFileSync(fd,JSON.stringify(result));fsyncSync(fd);}finally{closeSync(fd);}renameSync(temporary,target);const d=openSync(directory,constants.O_RDONLY|constants.O_DIRECTORY);try{fsyncSync(d);}finally{closeSync(d);}}finally{try{unlinkSync(temporary);}catch{}}
 return result;
}
