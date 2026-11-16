import {parseDaySessionReview,type DaySessionReview} from './coaching-trading-day-evaluation';
/** Versioned, shared coach/student trade evaluation. No Journal or provider dependencies. */
export const TRADE_EVALUATION_POLICY='trade-evaluation-v1' as const;
export const TRADE_RATING_GUIDE=[
 'Major execution problems',
 'Clear improvement needed',
 'Partially meets expectations',
 'Good execution, minor issues',
 'Strong execution against the agreed approach',
] as const;
export const STANDARD_TRADE_CRITERIA=[
 {id:'setup',name:'Setup quality',meaning:'Quality of the opportunity against the agreed trading approach.'},
 {id:'entry',name:'Entry execution',meaning:'Timing and execution of the planned entry.'},
 {id:'risk',name:'Risk management',meaning:'Position risk, stop discipline and downside control.'},
 {id:'exit',name:'Exit management',meaning:'Management of the planned exit and profit-taking.'},
 {id:'discipline',name:'Discipline',meaning:'Following the agreed trading rules and plan.'},
] as const;
export type TradeCriterion=Readonly<{id:string;name:string;meaning:string;kind:'rating'|'yes_no'|'written';version:number;rubric?:Readonly<{version:number;levels:readonly string[]}>}>;
export const GENERAL_FEEDBACK_ID='written:81aaf82a-4a55-4eb4-a678-d6eab618c823';
export const GENERAL_FEEDBACK_DESCRIPTION='Add any other observations or guidance for the student.';
export const BUILTIN_WRITTEN_FIELDS=[{id:'whatWorked',title:'What worked'},{id:'whatToImprove',title:'What to improve'},{id:'nextAction',title:'Next action'}] as const;
const DEFAULT_WRITTEN_GUIDANCE={
 nextAction:"Describe the specific action or change the student should focus on during the next review period.\n\nExplain what the student should do differently, how to apply it to future trades, and what successful execution would look like. Keep the guidance clear, practical, and achievable, focusing on the most important improvement identified in the review.",
 whatWorked:"Describe the successful decisions, behaviors, and strategies the student demonstrated during the review period.\n\nExplain what the student did well, why those actions were effective, and how they contributed to better trading decisions or execution. Highlight positive habits, improvements from previous reviews, and specific examples worth repeating in future trades.",
 whatToImprove:"Describe the most important areas where the student's trading decisions, execution, or discipline could improve.\n\nExplain what needs improvement, why it matters, and how the student could approach similar situations more effectively in future trades. Focus on constructive, actionable feedback that helps the student recognize mistakes, correct weaknesses, and develop more consistent trading habits.",
} as const;

export type WrittenFeedbackField=Readonly<{id:string;title:string;guidance?:string;enabled:boolean;required:boolean;version:number}>;
export type WrittenFeedbackConfig=Readonly<{version:number;fields:readonly WrittenFeedbackField[]}>;
export type TradeEvaluationTemplate=Readonly<{schemaVersion:1;version:number;name:string;daySessionReview?:DaySessionReview;reviewDesign?:Readonly<{version:1;journalEvidence:boolean;rulesFieldId?:string;strategyFieldId?:string}>;writtenFeedback?:WrittenFeedbackConfig;criteria:readonly TradeCriterion[];scale:readonly string[];policyVersion:typeof TRADE_EVALUATION_POLICY}>;
export type TradeEvaluation=Readonly<{templateVersion:number;answers:Readonly<Record<string,string|number>>;whatWorked:string;whatToImprove:string;nextAction:string;writtenAnswers?:Readonly<Record<string,string>>;actionCriterionId?:string}>;
/** These defaults apply only to newly authored templates. Legacy snapshots keep their original guide. */
const NEW_TRADE_RUBRICS:Readonly<Record<string,readonly string[]>>={
 setup:['No clear reason for the trade is documented.','The reason for the trade is vague or unsupported.','Some evidence supports the trade; important evidence is missing.','The documented evidence supports the trade with minor gaps.','The documented evidence clearly supports the reason for the trade.'],
 entry:['Entry execution has major timing or order problems.','Entry execution has clear timing or order problems.','Entry execution has a mix of effective and ineffective decisions.','Entry execution is effective with minor issues.','Entry timing and order execution are consistently well supported by the trade evidence.'],
 risk:['Position size and protective exits expose the account to major avoidable risk.','Position size or protective exits create clear avoidable risk.','Risk control is mixed, with some avoidable exposure.','Position size and protective exits control risk with minor issues.','Position size, exposure and protective exits show consistent risk control.'],
 exit:['Exit decisions show major avoidable execution or management problems.','Exit decisions show clear execution or management problems.','Exit decisions have a mix of effective and ineffective management.','Exit decisions are effective with minor issues.','Exit timing, execution and management are consistently supported by the trade evidence.'],
 discipline:['The trade repeatedly contradicts the student’s shared rules.','The trade clearly departs from the student’s shared rules.','The trade follows some shared rules but misses others.','The trade follows the shared rules with minor departures.','The trade consistently follows the student’s shared rules.'],
};
const NEW_TRADE_MEANINGS:Readonly<Record<string,string>>={setup:'Evidence supporting the reason for taking the trade.',entry:'Timing and execution of the recorded entry.',risk:'Position size, exposure and protective exits.',exit:'Timing, execution and management of exits.',discipline:'Consistency with the student’s shared trading rules. Use Insufficient information if those rules are unavailable.'};
export function defaultTradeCriterion(id:string):TradeCriterion{const item=STANDARD_TRADE_CRITERIA.find(c=>c.id===id);if(!item)throw new Error('Choose a standard criterion.');return {...item,meaning:NEW_TRADE_MEANINGS[id],kind:'rating',version:1,rubric:{version:1,levels:[...NEW_TRADE_RUBRICS[id]]}};}
export function tradeCriterionLevels(template:TradeEvaluationTemplate,criterion:TradeCriterion):readonly string[]{return criterion.rubric?.levels??template.scale;}
export function defaultTradeEvaluationTemplate():TradeEvaluationTemplate{return {schemaVersion:1,version:1,name:'Trade evaluation',reviewDesign:{version:1,journalEvidence:false},writtenFeedback:{version:1,fields:[...BUILTIN_WRITTEN_FIELDS.map(field=>({...field,guidance:DEFAULT_WRITTEN_GUIDANCE[field.id],enabled:true,required:true,version:1})),{id:GENERAL_FEEDBACK_ID,title:'General feedback',guidance:GENERAL_FEEDBACK_DESCRIPTION,enabled:true,required:false,version:1}]},criteria:STANDARD_TRADE_CRITERIA.map(item=>defaultTradeCriterion(item.id)),scale:[...TRADE_RATING_GUIDE],policyVersion:TRADE_EVALUATION_POLICY};}
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the trade evaluation.');return value as Record<string,unknown>;}
function text(value:unknown,max:number,required=false):string{if(typeof value!=='string'||value.length>max||required&&!value.trim())throw new Error('Check the evaluation names, meanings and feedback.');return value;}
function version(value:unknown):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new Error('Check the evaluation version.');return value;}
const WRITTEN_UUID=/^written:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function builtinWrittenId(id:string):id is 'whatWorked'|'whatToImprove'|'nextAction'{return BUILTIN_WRITTEN_FIELDS.some(field=>field.id===id);}
/** Resolve legacy fields for display/validation only; never rewrite an accepted snapshot. */
export function tradeWrittenFields(template:TradeEvaluationTemplate):readonly WrittenFeedbackField[]{return template.writtenFeedback?.fields??BUILTIN_WRITTEN_FIELDS.map(field=>({...field,enabled:true,required:true,version:1}));}
export function tradeWrittenAnswer(value:TradeEvaluation,field:WrittenFeedbackField):string{return builtinWrittenId(field.id)?value[field.id]:value.writtenAnswers?.[field.id]??'';}
function parseWrittenConfig(value:unknown):WrittenFeedbackConfig{
 const raw=object(value);if(Object.keys(raw).some(key=>!['version','fields'].includes(key))||!Array.isArray(raw.fields)||raw.fields.length>12)throw new Error('Use up to 12 written feedback fields.');
 const ids=new Set<string>(),titles=new Set<string>();
 const fields=raw.fields.map(value=>{const field=object(value),id=text(field.id,100,true),title=text(field.title,80,true).trim();
  if(Object.keys(field).some(key=>!['id','title','guidance','enabled','required','version'].includes(key))||ids.has(id)||titles.has(title.toLocaleLowerCase())||!builtinWrittenId(id)&&!WRITTEN_UUID.test(id)||typeof field.enabled!=='boolean'||typeof field.required!=='boolean')throw new Error('Use distinct written fields with valid enabled and required choices.');
  ids.add(id);titles.add(title.toLocaleLowerCase());
  return {id,title,...(field.guidance===undefined?{}:{guidance:text(field.guidance,1000)}),enabled:field.enabled,required:field.required,version:version(field.version)};
 });
 if(!BUILTIN_WRITTEN_FIELDS.every(field=>ids.has(field.id)))throw new Error('Keep the three standard written fields; disable any you do not need.');
 return {version:version(raw.version),fields};
}
function parseReviewDesign(value:unknown,written:WrittenFeedbackConfig|undefined):NonNullable<TradeEvaluationTemplate['reviewDesign']>{
 const raw=object(value);if(raw.version!==1||typeof raw.journalEvidence!=='boolean'||Object.keys(raw).some(key=>!['version','journalEvidence','rulesFieldId','strategyFieldId'].includes(key))||!written)throw new Error('Use the supported Trade Review design with written field settings.');
 const refs=['rulesFieldId','strategyFieldId'] as const,seen=new Set<string>();
 for(const key of refs)if(raw[key]!==undefined){const id=text(raw[key],100,true);if(!WRITTEN_UUID.test(id)||seen.has(id)||!written.fields.some(field=>field.id===id))throw new Error('Choose distinct existing written fields for Rules and Strategy guidance.');seen.add(id);}
 return {version:1,journalEvidence:raw.journalEvidence,...(raw.rulesFieldId===undefined?{}:{rulesFieldId:raw.rulesFieldId as string}),...(raw.strategyFieldId===undefined?{}:{strategyFieldId:raw.strategyFieldId as string})};
}
export function usesTradeReviewDesign(template:TradeEvaluationTemplate|undefined):boolean{return template?.reviewDesign?.version===1;}
export function tradeReviewRulesEnabled(template:TradeEvaluationTemplate|undefined):boolean{return Boolean(template?.reviewDesign?.rulesFieldId&&tradeWrittenFields(template).some(field=>field.id===template.reviewDesign!.rulesFieldId&&field.enabled));}
export function parseTradeEvaluationTemplate(value:unknown):TradeEvaluationTemplate{
 const raw=object(value);if(raw.schemaVersion!==1||raw.policyVersion!==TRADE_EVALUATION_POLICY||!Array.isArray(raw.criteria)||raw.criteria.length>20||!raw.criteria.length)throw new Error('Choose a supported evaluation template.');
 if(!Array.isArray(raw.scale)||JSON.stringify(raw.scale)!==JSON.stringify(TRADE_RATING_GUIDE))throw new Error('Use the shared 1–5 rating guide.');
 const ids=new Set<string>(),names=new Set<string>();
 const criteria=raw.criteria.map(value=>{const item=object(value),id=text(item.id,100,true),standard=STANDARD_TRADE_CRITERIA.find(c=>c.id===id);
  if(ids.has(id)||!standard&&!/^custom:[0-9a-f-]{36}$/i.test(id)||!['rating','yes_no','written'].includes(String(item.kind)))throw new Error('Use distinct, valid evaluation criteria.');ids.add(id);
  const kind=standard?'rating':item.kind as TradeCriterion['kind'];
  let rubric:TradeCriterion['rubric'];
  if(item.rubric!==undefined){const rawRubric=object(item.rubric);if(kind!=='rating'||!Array.isArray(rawRubric.levels)||rawRubric.levels.length!==5)throw new Error('Provide five rating definitions from 1 lowest to 5 highest.');rubric={version:version(rawRubric.version),levels:rawRubric.levels.map(level=>text(level,400,true).trim())};}
  const name=standard?.name??text(item.name,80,true).trim(),meaning=standard&&!rubric?standard.meaning:text(item.meaning,400,true).trim();
  if(names.has(name.toLocaleLowerCase()))throw new Error('Use distinct evaluation field names.');names.add(name.toLocaleLowerCase());
  return {id,name,meaning,kind,version:standard&&!rubric?1:version(item.version),...(rubric?{rubric}:{})};
 });
 if(!criteria.some(c=>c.kind==='rating'))throw new Error('Choose at least one rated criterion for automatic improvement history.');
 if(raw.daySessionReview!==undefined&&raw.reviewDesign===undefined)throw new Error('Choose the versioned trade template for this Trading-day review.');
 const writtenFeedback=raw.writtenFeedback===undefined?undefined:parseWrittenConfig(raw.writtenFeedback);
 return {schemaVersion:1,version:version(raw.version),name:text(raw.name,100,true).trim(),...(writtenFeedback?{writtenFeedback}:{}),...(raw.reviewDesign===undefined?{}:{reviewDesign:parseReviewDesign(raw.reviewDesign,writtenFeedback)}),...(raw.daySessionReview===undefined?{}:{daySessionReview:parseDaySessionReview(raw.daySessionReview)}),criteria,scale:[...TRADE_RATING_GUIDE],policyVersion:TRADE_EVALUATION_POLICY};
}
/** Exact definition content is part of comparability; an equal version number alone is insufficient. */
export function tradeCriterionKey(template:TradeEvaluationTemplate,criterion:TradeCriterion):string{const legacy=[criterion.id,criterion.version,criterion.name,criterion.meaning,criterion.kind,template.scale,template.policyVersion];return JSON.stringify(criterion.rubric?[...legacy,criterion.rubric]:legacy);}
export function reviseTradeEvaluationTemplate(value:TradeEvaluationTemplate,prior:TradeEvaluationTemplate|undefined,revision:number):TradeEvaluationTemplate{
 const next=parseTradeEvaluationTemplate(value);
 const written=next.writtenFeedback;
 const writtenFeedback=written?{...written,version:prior?.writtenFeedback?(JSON.stringify(written.fields.map(({version:_,...field})=>field))===JSON.stringify(prior.writtenFeedback.fields.map(({version:_,...field})=>field))?prior.writtenFeedback.version:prior.writtenFeedback.version+1):1,fields:written.fields.map(field=>{const old=prior?.writtenFeedback?.fields.find(item=>item.id===field.id);return {...field,version:old?(old.title===field.title&&old.guidance===field.guidance&&old.enabled===field.enabled&&old.required===field.required?old.version:old.version+1):1};})}:undefined;
 return {...next,...(writtenFeedback?{writtenFeedback}:{}),version:revision,criteria:next.criteria.map(criterion=>{
  if(STANDARD_TRADE_CRITERIA.some(c=>c.id===criterion.id)&&!criterion.rubric)return {...criterion,version:1};
  const old=prior?.criteria.find(c=>c.id===criterion.id);
  const rubricUnchanged=JSON.stringify(old?.rubric?.levels)===JSON.stringify(criterion.rubric?.levels);
  const unchanged=old&&old.name===criterion.name&&old.meaning===criterion.meaning&&old.kind===criterion.kind&&rubricUnchanged;
  return {...criterion,version:old?(unchanged?old.version:old.version+1):1,...(criterion.rubric?{rubric:{...criterion.rubric,version:old?.rubric?(unchanged?old.rubric.version:old.rubric.version+1):1}}:{})};
 })};
}
export function parseTradeEvaluation(value:unknown):TradeEvaluation{
 const raw=object(value),keys=['templateVersion','answers','whatWorked','whatToImprove','nextAction','actionCriterionId','writtenAnswers'];if(Object.keys(raw).some(key=>!keys.includes(key)))throw new Error('Unknown trade evaluation field.');
 const entries=Object.entries(object(raw.answers));if(entries.length>20)throw new Error('Too many evaluation answers.');
 const answers:Record<string,string|number>=Object.create(null);
 for(const [id,value] of entries){if(id.length>100||id==='__proto__'||id==='constructor'||id==='prototype')throw new Error('Choose a valid criterion.');if(typeof value==='number'){if(!Number.isInteger(value)||value<1||value>5)throw new Error('Choose a score from 1 to 5.');answers[id]=value;}else answers[id]=text(value,4000);}
 let writtenAnswers:Record<string,string>|undefined;
 if(Object.hasOwn(raw,'writtenAnswers')){const entries=Object.entries(object(raw.writtenAnswers));if(entries.length>9)throw new Error('Too many written responses.');writtenAnswers=Object.create(null) as Record<string,string>;for(const [id,value] of entries){if(!WRITTEN_UUID.test(id))throw new Error('Choose a valid written field.');writtenAnswers[id]=text(value,4000);}}
 return {templateVersion:version(raw.templateVersion),answers,whatWorked:text(raw.whatWorked,12000),whatToImprove:text(raw.whatToImprove,12000),nextAction:text(raw.nextAction,12000),...(writtenAnswers===undefined?{}:{writtenAnswers}),...(raw.actionCriterionId===undefined?{}:{actionCriterionId:text(raw.actionCriterionId,100)})};
}
export function validateTradeEvaluation(value:unknown,template:TradeEvaluationTemplate):TradeEvaluation{
 const evaluation=parseTradeEvaluation(value);if(evaluation.templateVersion!==template.version)throw new Error('Use the accepted evaluation template version.');
 for(const [id,answer] of Object.entries(evaluation.answers)){const criterion=template.criteria.find(c=>c.id===id);if(!criterion)throw new Error('Answer only the agreed evaluation fields.');if(criterion.kind==='rating'&&!(typeof answer==='number'||['not_assessed','insufficient_information'].includes(String(answer)))||criterion.kind==='yes_no'&&!['yes','no','not_assessed','insufficient_information',''].includes(String(answer))||criterion.kind==='written'&&typeof answer!=='string')throw new Error('Choose an answer matching the agreed field.');}
 if(!template.writtenFeedback&&evaluation.writtenAnswers!==undefined)throw new Error('Answer only the accepted written fields.');
 if(template.writtenFeedback){
  const fields=tradeWrittenFields(template);
  for(const id of Object.keys(evaluation.writtenAnswers??{})){if(!fields.some(field=>field.id===id&&field.enabled))throw new Error('Answer only enabled, accepted written fields.');}
  if(fields.some(field=>!field.enabled&&builtinWrittenId(field.id)&&evaluation[field.id]!==''))throw new Error('A disabled written field cannot receive feedback.');
  if(fields.reduce((total,field)=>total+tradeWrittenAnswer(evaluation,field).length,0)>36000)throw new Error('Written feedback must fit within 36,000 characters per trade.');
  if(evaluation.actionCriterionId&&!fields.some(field=>field.id==='nextAction'&&field.enabled))throw new Error('Next action is disabled in this accepted template.');
 }
 if(evaluation.actionCriterionId&&!template.criteria.some(c=>c.id===evaluation.actionCriterionId&&c.kind==='rating'))throw new Error('Choose an agreed rated criterion for this action.');return evaluation;
}
export function tradeEvaluationReady(value:unknown,template:TradeEvaluationTemplate):boolean{
 try{const evaluation=validateTradeEvaluation(value,template);return tradeWrittenFields(template).filter(field=>field.enabled&&field.required).every(field=>Boolean(tradeWrittenAnswer(evaluation,field).trim()))&&template.criteria.filter(c=>c.kind==='rating').every(c=>Object.hasOwn(evaluation.answers,c.id));}catch{return false;}
}
