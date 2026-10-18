import type {CoachingPlanConfiguration} from "./coaching-plan-configuration";
import type {TraderLinkCommunityCoachingPlanItem,TraderLinkCommunityCoachingJournalScope} from "./traderlink-community-platform-contracts";
export type CoachingRequiredScope=TraderLinkCommunityCoachingJournalScope|"day_rules";
export const COACHING_ACCESS_LABELS:Partial<Record<CoachingRequiredScope,string>>={trades:"Trades and executions",trade_notes:"Trade notes",rules:"Rules and rule tracking",tags:"Tags",analytics:"Analytics and existing analysis",journal_notes:"Trading-day notes",day_rules:"Trading-day rules"};
export function coachingRequiredAccess(items:readonly Pick<TraderLinkCommunityCoachingPlanItem,"itemType"|"focusAreas"|"reviewDepth">[],configuration?:CoachingPlanConfiguration):CoachingRequiredScope[]{
 const scopes=new Set<CoachingRequiredScope>();
 for(const item of items){if(!['trade_review','trading_day_review','performance_review','strategy_review','journal_review','rules_review','risk_review','goal_review'].includes(item.itemType))continue;
 scopes.add('trades');scopes.add('analytics');
 const focus=item.focusAreas??[];
 if(focus.includes('journal')||focus.includes('strategy_guidance')||item.itemType==='strategy_review'||item.itemType==='journal_review'){scopes.add('trade_notes');scopes.add('tags');}
 if(focus.includes('rules')||item.itemType==='rules_review'){scopes.add('rules');scopes.add('day_rules');}
 // Explicit new-offer metadata avoids broadening older accepted consent.
 if(item.itemType==='performance_review'&&focus.includes('journal')&&configuration?.offers.performance_review?.includeDayJournal)scopes.add('journal_notes');
 if(item.itemType==='trading_day_review'&&item.reviewDepth==='complete_day')scopes.add('journal_notes');
 }
 return [...scopes];
}
