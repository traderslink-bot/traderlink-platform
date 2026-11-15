/** Return destinations stay inside coaching. Never trust a query-string URL as
 * an external redirect or permit a return chain through another review. */
export function independentCoachingReturnHref(value:unknown):string{
 if(typeof value!=='string'||value.length>2000||!value.startsWith('/coaching')||value.includes('\\'))return '/coaching/students';
 try{
  const url=new URL(value,'https://coaching.invalid');
  if(url.origin!=='https://coaching.invalid'||!/^\/coaching(?:\/(?:students|my-coaching|calendar|plans\/[A-Za-z0-9-]+|enrollments\/[A-Za-z0-9-]+))?$/.test(url.pathname))return '/coaching/students';
  if([...url.searchParams.keys()].some(key=>!['view','anchor','day','work','students'].includes(key)))return '/coaching/students';
  const fragment=new URLSearchParams(url.hash.slice(1));
  if(url.hash&&!url.hash.includes('=')&&!['#work','#students'].includes(url.hash))return '/coaching/students';
  if(url.hash.includes('=')&&[...fragment.keys()].some(key=>!['student','section','work','reviewFilter'].includes(key)))return '/coaching/students';
  return url.pathname+url.search+url.hash;
 }catch{return '/coaching/students';}
}
