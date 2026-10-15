export function easternInput(at: number): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at).map(p=>[p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function easternCandidates(value: string): number[] {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return [];
  return ['-04:00','-05:00'].map(offset=>Date.parse(value+':00'+offset)).filter(at=>Number.isFinite(at)&&easternInput(at)===value).sort((a,b)=>a-b);
}
