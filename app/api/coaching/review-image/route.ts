import {requirePlatformMutationRequest} from '@/src/modules/platform/server/authentication/platform-mutation-request-security';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withPlatformDatabase} from '@/src/modules/platform/server/database/open-platform-database';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {IndependentCoachingReviewImages} from '@/src/modules/communities/server/independent-coaching-review-images';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 let actor:string;try{actor=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const query=new URL(request.url).searchParams;
 try{
  if(query.has('imageId')){const image=withReadonlyPlatformDatabase({},db=>new IndependentCoachingReviewImages(db).read(query.get('imageId')!,actor));return new Response(new Uint8Array(image.content),{headers:{...headers,'Content-Type':image.mediaType,'Content-Disposition':'inline'}});}
  return Response.json(withReadonlyPlatformDatabase({},db=>new IndependentCoachingReviewImages(db).list(query.get('reviewId')??'',actor)),{headers});
 }catch{return Response.json({error:'This review image is unavailable.'},{status:403,headers});}
}
export async function POST(request:Request){
 try{requirePlatformMutationRequest(request);}catch{return Response.json({error:'Open this form from TraderLink.'},{status:403,headers});}
 let actor:string;try{actor=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 try{
  // Bound multipart intake before parsing, including clients without Content-Length.
  const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>8500000){await reader.cancel();return Response.json({error:'Select an image of 8 MB or smaller.'},{status:413,headers});}chunks.push(part.value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData(),image=form.get('image');
  if(!(image instanceof File)||[...form.values()].filter(value=>value instanceof File).length!==1)throw Error();
  const content=Buffer.from(await image.arrayBuffer());
  const imageId=withPlatformDatabase({mode:'runtime'},db=>new IndependentCoachingReviewImages(db).add({reviewId:String(form.get('reviewId')??''),actorUserId:actor,roundTripId:String(form.get('roundTripId')??'')||undefined,filename:image.name,mediaType:image.type,content,atUtc:new Date().toISOString()}));
  return Response.json({imageId},{headers});
 }catch{return Response.json({error:'The image could not be saved. Check the image and current review access.'},{status:400,headers});}
}

export async function DELETE(request:Request){
 try{requirePlatformMutationRequest(request);}catch{return Response.json({error:'Open this form from TraderLink.'},{status:403,headers});}
 let actor:string;try{actor=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 try{const imageId=new URL(request.url).searchParams.get('imageId');if(!imageId||imageId.length>100)throw Error();withPlatformDatabase({mode:'runtime'},db=>new IndependentCoachingReviewImages(db).remove(imageId,actor));return Response.json({removed:true},{headers});}catch{return Response.json({error:'The image could not be removed.'},{status:403,headers});}
}
