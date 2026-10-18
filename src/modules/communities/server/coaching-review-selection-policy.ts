import type Database from "better-sqlite3";
import {coachingReviewService} from "./coaching-review-service-binding";
/** Never use later public plan edits to authorize an accepted review. */
export function coachingReviewSelectionPolicy(db:Database.Database,reviewId:string,_workspaceKind?:string){
 const service=coachingReviewService(db,reviewId);
 if(!service)return {coachCanSelect:false,studentCanSelect:false,reason:"Identify the accepted plan service before selecting trades."};
 const mode=service.item.selectionMode;
 const coachCanSelect=mode==='coach'||mode==='coach_or_student';
 const studentCanSelect=mode==='student'||mode==='coach_or_student';
 return {coachCanSelect,studentCanSelect,reason:coachCanSelect?'The agreed plan permits the coach to add shared trades.':studentCanSelect?'The student chooses trades under this accepted service.':'This service does not include individual trade selection.'};
}
