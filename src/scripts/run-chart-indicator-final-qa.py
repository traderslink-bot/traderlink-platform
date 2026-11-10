#!/usr/bin/env python3
"""Run one complete isolated indicator QA inventory; never touch hosted services."""
import argparse,datetime,fcntl,json,os,pathlib,subprocess,time
parser=argparse.ArgumentParser();parser.add_argument('--pass-number',type=int,choices=[1,2,3],required=True);parser.add_argument('--source',required=True);args=parser.parse_args()
if len(args.source)!=40 or any(c not in '0123456789abcdef' for c in args.source):raise SystemExit('Invalid source SHA')
root=pathlib.Path.cwd();out=pathlib.Path('/tmp/traderlink-chart-final-qa-20261110')/f'pass-{args.pass_number}-{args.source[:12]}'
out.mkdir(parents=True,exist_ok=False)
unit_files=sorted(str(p) for p in pathlib.Path('src/modules/scanner/alpaca').glob('*.test.ts') if (p.name.startswith(('chart-','vwap-')) or p.name in ['candles.test.ts','rolling-deviation.test.ts']) and p.name!='chart-live-book.test.ts')
for name in unit_files+['src/modules/scanner/alpaca/chart-indicators.ts','src/modules/scanner/alpaca/chart-preferences.ts','src/modules/scanner/alpaca/rolling-deviation.ts']:
 if pathlib.Path(name).read_bytes()!=subprocess.check_output(['git','show',args.source+':'+name]):raise SystemExit('Working source differs: '+name)
env=dict(os.environ,TRADERLINK_SOURCE_REF=args.source,TRADERLINK_TEST_CHROMIUM='/home/traderlink/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell',TRADERLINK_EXPECT_PRICE_ONLY='1',TRADERLINK_CHECK_CROSSHAIR='1',TRADERLINK_REAL_TOUCH='1')
cases=[('types',['node','--max-old-space-size=4096','src/scripts/typecheck-chart-indicators.cjs',args.source]),('units',['npx','vitest','run',*unit_files,'--maxWorkers=1','--no-file-parallelism'])]
for name in ['standard-indicators','vwap-bands','vwap-timeframes','vwap-forming','vwap-visibility','vwap-events','vwap-offset-axis','vwap-calendar-axis','vwap-history-window','crosshair-axis']:
 cases.append((name,['traderlink-browser-env','node',f'src/scripts/verify-chart-{name}.cjs']))
report={'source':args.source,'pass':args.pass_number,'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Owner-clarified standard indicators; existing offered settings; isolated synthetic HTTP/events; no hosted integration claim','unit_files':unit_files,'results':[],'complete':False}
report_path=out/'results.json'
def save():report_path.write_text(json.dumps(report,indent=2)+'\n')
save();marker='/tmp/traderlink-feature-qa-locks/active.lock';fd=os.open(marker,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600);own=os.fstat(fd)
try:
 os.write(fd,json.dumps({'owner':'chart-final-qa','pass':args.pass_number,'pid':os.getpid()}).encode())
 with open('/tmp/traderlink-vps-common-heavy.lock','a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  for name,command in cases:
   print('START',args.pass_number,name,flush=True);began=time.monotonic();log=out/(name+'.log')
   try:
    with log.open('w') as stream:result=subprocess.run(command,env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=240)
    code=result.returncode
   except subprocess.TimeoutExpired:code=124
   report['results'].append({'case':name,'exit':code,'seconds':round(time.monotonic()-began,3),'log':str(log)});save();print('RESULT',args.pass_number,name,code,flush=True)
  report['complete']=all(row['exit']==0 for row in report['results']);report['finished']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
finally:
 os.close(fd)
 if os.stat(marker).st_ino==own.st_ino:os.unlink(marker)
print('REPORT',report_path,'COMPLETE',report['complete'],flush=True)
raise SystemExit(0 if report['complete'] else 1)
