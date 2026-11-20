import {describe,expect,it} from 'vitest';
import type {IndependentCoachWorkRow} from '@/src/modules/communities/server/independent-coaching-work-read';
import {workProgressLines} from './work-presentation';

const row:IndependentCoachWorkRow={reviewId:'review',enrollmentId:'enrollment',studentId:'student',studentName:'Student',planId:'plan',planName:'Plan',kind:'trade',status:'ready',dueAtUtc:'2026-11-23T18:00:00.000Z',periodStart:null,periodEnd:null};
const progress={availability:'available' as const,acceptedQuantity:3,acceptedUnit:'trades' as const,progress:{unit:'trades' as const,selected:1,saved:0},unavailableReason:null};

describe('accepted trade quantity and submitted review progress',()=>{
 it.each(['3 trades per week','7 trades every two weeks','10 trades per month','1 trade in total'])('keeps %s separate from the one submitted trade',acceptedAllowanceLabel=>{
  const lines=workProgressLines({...row,reviewProgress:{...progress,acceptedAllowanceLabel}});
  expect(lines).toContain('Trade reviews included: '+acceptedAllowanceLabel);
  expect(lines).toContain('0 of 1 trade drafts saved · 1 incomplete');
  expect(lines.join(' ')).not.toContain('per review');
 });
 it('retains the scheduled per-review count when no request allowance applies',()=>{
  expect(workProgressLines({...row,reviewProgress:progress})).toContain('Agreed count: 3 trades per review');
 });
 it('keeps the known allowance accurate when saved progress is unavailable',()=>{
  const lines=workProgressLines({...row,reviewProgress:{availability:'unavailable',acceptedQuantity:3,acceptedUnit:'trades',acceptedAllowanceLabel:'3 trades per week',progress:null,unavailableReason:'identity_unavailable'}});
  expect(lines).toContain('Trade reviews included: 3 trades per week');
  expect(lines).toContain('Saved progress unavailable.');
  expect(lines.join(' ')).not.toContain('per review');
 });
});
