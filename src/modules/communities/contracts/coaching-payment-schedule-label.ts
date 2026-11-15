import type {CoachingAgreementTerms} from './coaching-agreements';
export function coachingPaymentScheduleLabel(terms:CoachingAgreementTerms):string{
 if(terms.priceAmountMinor===0)return 'No coach service charge';
 if(terms.billingCadence==='one_time')return 'One-time';
 if(terms.builderConfig?.payment?.method==='whop'){
  const days=terms.billingCadence==='weekly'?7:terms.builderConfig.payment.billingIntervalDays;
  return days?`Every ${days} days`:'Confirm the billing interval';
 }
 return terms.billingCadence==='weekly'?'Weekly':terms.billingCadence==='monthly'?'Monthly':terms.customIntervalDays?`Every ${terms.customIntervalDays} days`:'Agreed billing interval';
}
