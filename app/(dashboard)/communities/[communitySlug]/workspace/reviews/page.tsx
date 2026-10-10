import {redirect} from "next/navigation";

export default async function Page({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params;
  redirect(`/communities/${communitySlug}/workspace`);
}
