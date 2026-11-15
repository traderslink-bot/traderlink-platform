export type IndependentCoachSocialLinks=Readonly<{stocktwits:string;x:string;youtube:string}>;

export const EMPTY_INDEPENDENT_COACH_SOCIAL_LINKS:IndependentCoachSocialLinks=Object.freeze({stocktwits:'',x:'',youtube:''});

const hosts:Readonly<Record<keyof IndependentCoachSocialLinks,readonly string[]>>={
 stocktwits:['stocktwits.com','www.stocktwits.com'],
 x:['x.com','www.x.com','twitter.com','www.twitter.com'],
 youtube:['youtube.com','www.youtube.com','m.youtube.com','youtu.be'],
};
const labels:Readonly<Record<keyof IndependentCoachSocialLinks,string>>={stocktwits:'Stocktwits',x:'X',youtube:'YouTube'};

export function parseIndependentCoachSocialUrl(provider:keyof IndependentCoachSocialLinks,value:unknown):string{
 if(value===undefined||value==='')return '';
 if(typeof value!=='string'||value.length>1000)throw new Error(`Enter a valid ${labels[provider]} URL.`);
 let url:URL;try{url=new URL(value.trim());}catch{throw new Error(`Enter a valid ${labels[provider]} URL.`);}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port||!hosts[provider].includes(url.hostname.toLowerCase()))throw new Error(`Enter a valid ${labels[provider]} URL.`);
 url.hash='';return url.href;
}

export function parseIndependentCoachSocialLinks(value:unknown):IndependentCoachSocialLinks{
 const row=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 return Object.freeze({stocktwits:parseIndependentCoachSocialUrl('stocktwits',row.stocktwits),x:parseIndependentCoachSocialUrl('x',row.x),youtube:parseIndependentCoachSocialUrl('youtube',row.youtube)});
}

export type ParsedIndependentCoachProfile=Readonly<{displayName:string;headline:string;biography:string;deliverySummary:string;socialLinks:IndependentCoachSocialLinks}>;
export function parseIndependentCoachProfile(value:unknown):ParsedIndependentCoachProfile{
 const row=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const text=(key:string,required=false,max=4000)=>{const candidate=row[key];if(typeof candidate!=='string'||candidate.length>max||required&&!candidate.trim())throw new Error('This coach profile is unavailable.');return candidate.trim();};
 return Object.freeze({displayName:text('displayName',true,120),headline:text('headline'),biography:text('biography'),deliverySummary:text('deliverySummary'),socialLinks:parseIndependentCoachSocialLinks(row.socialLinks)});
}
