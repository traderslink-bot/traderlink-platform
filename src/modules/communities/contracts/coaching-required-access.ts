import type {CoachingPlanConfiguration} from "./coaching-plan-configuration";
import type {TraderLinkCommunityCoachingPlanItem,TraderLinkCommunityCoachingJournalScope} from "./traderlink-community-platform-contracts";
export type CoachingRequiredScope=TraderLinkCommunityCoachingJournalScope|"day_rules";
export const COACHING_ACCESS_LABELS:Partial<Record<CoachingRequiredScope,string>>={trades:"Trades and executions",trade_notes:"Trade notes",rules:"Rules and rule tracking",tags:"Tags",analytics:"Analytics and existing analysis",journal_notes:"Trading-day notes",day_rules:"Trading-day rules"};
export function coachingRequiredAccess(items:readonly Pick<TraderLinkCommunityCoachingPlanItem,"itemType"|"focusAreas"|"reviewDepth">[],_configuration?:CoachingPlanConfiguration):CoachingRequiredScope[]{
 void _configuration;
 const scopes=new Set<CoachingRequiredScope>();
 for(const item of items){if(!['trade_review','trading_day_review','performance_review','strategy_review','journal_review','rules_review','risk_review','goal_review'].includes(item.itemType))continue;
 scopes.add('trades');scopes.add('analytics');
 const focus=item.focusAreas??[];
 if(item.itemType==='trading_day_review'){scopes.add('rules');scopes.add('day_rules');}
 // Notes and tags support ordinary reviews only when the student shares them.
 if(item.itemType==='journal_review'||item.itemType==='strategy_review'){scopes.add('trade_notes');scopes.add('tags');}
 if(focus.includes('rules')||item.itemType==='rules_review'){scopes.add('rules');scopes.add('day_rules');}

 }
 return [...scopes];
}
