#!/usr/bin/env python3
"""Finite synthetic/source QA under the existing shared VPS guards; no server or hosted writes."""
import datetime, fcntl, json, os, pathlib, signal, stat, subprocess, time
root=pathlib.Path.cwd()
output=pathlib.Path('/tmp/traderlink-news-unified-qa-20261118');output.mkdir(mode=0o700,exist_ok=True)
parent=pathlib.Path('/tmp/traderlink-feature-qa-locks')
parent_stat=parent.lstat()
if not stat.S_ISDIR(parent_stat.st_mode) or parent_stat.st_uid!=os.getuid() or stat.S_IMODE(parent_stat.st_mode)!=0o700:raise SystemExit('Unsafe QA guard directory')
marker=parent/'active.lock'
try: marker_fd=os.open(marker,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
except FileExistsError:
 print(json.dumps({'state':'BLOCKED_SHARED_QA_GUARD','owner':marker.read_text()}));raise SystemExit(75)
own=os.fstat(marker_fd);heavy=None
report={'scope':'News finite synthetic/source/component QA; no Next server/Auth/hosted calls','started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':[],'passed':False}
try:
 os.write(marker_fd,json.dumps({'owner':'News unified-feed finite QA','pid':os.getpid()}).encode())
 heavy=os.open('/tmp/traderlink-vps-common-heavy.lock',os.O_RDWR|os.O_CREAT|os.O_NOFOLLOW,0o600)
 try:fcntl.flock(heavy,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('BLOCKED_COMMON_HEAVY_GUARD');raise SystemExit(75)
 mem=next(int(line.split()[1])*1024 for line in pathlib.Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:'))
 if mem<1200*1024*1024:raise SystemExit('Finite QA needs 1.2GiB available memory; retry after current work')
 cases=[('types',['node','--max-old-space-size=768','src/scripts/typecheck-press-release-filters.cjs']),('units',['node_modules/.bin/vitest','run','src/modules/news/server/press-release-unified-feed.test.ts','src/modules/news/server/press-release-filter-rollout.test.ts','src/modules/news/server/press-release-unified-routes.test.ts','src/modules/news/server/press-release-membership-read.test.ts','src/modules/news/press-release-detail-section.test.ts','src/modules/scanner/live/press-release-board-client.test.ts','src/lib/trader-intelligence-v3/__tests__/dashboard-template-enforcement.test.ts','--maxWorkers=1','--no-file-parallelism']),('lint',['node_modules/.bin/eslint','src/modules/news/contracts/press-release-filters.ts','src/modules/news/contracts/news-outbound-link.ts','src/modules/news/server/press-release-filter-query.ts','app/(dashboard)/press-releases/press-release-filter-controls.tsx','app/(dashboard)/press-releases/press-release-feed.tsx','app/(dashboard)/press-releases/press-release-actions.ts','app/(dashboard)/press-releases/press-release-article-drawer.tsx','app/(dashboard)/press-releases/[[...channel]]/page.tsx']),('outbound',['node','--test','src/modules/news/contracts/news-outbound-link.node-test.mjs']),('browser',['traderlink-browser-env','node','src/scripts/verify-press-release-unified-browser.cjs'])]
 selected=os.environ.get("NEWS_QA_CASES","").split(",") if os.environ.get("NEWS_QA_CASES") else [item[0] for item in cases]
 if any(name not in [item[0] for item in cases] for name in selected):raise SystemExit("Invalid QA case selection")
 for name,command in cases:
  if name not in selected:continue
  print('START',name,flush=True);start=time.monotonic()
  with (output/(name+'.log')).open('w') as stream:
   process=subprocess.Popen(command,cwd=root,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
   try:code=process.wait(timeout=120)
   except subprocess.TimeoutExpired:
    os.killpg(process.pid,signal.SIGTERM)
    try:process.wait(timeout=5)
    except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
    code=124
  report['checks'].append({'case':name,'exit':code,'seconds':round(time.monotonic()-start,3),'log':str(output/(name+'.log'))})
  (output/'summary.json').write_text(json.dumps(report,indent=2)+'\n');print('RESULT',name,code,flush=True)
 report['passed']=all(item['exit']==0 for item in report['checks'])
 report['finished']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 (output/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
finally:
 if heavy is not None:os.close(heavy)
 os.close(marker_fd)
 if marker.exists() and marker.lstat().st_ino==own.st_ino:marker.unlink()
print(json.dumps(report,indent=2));raise SystemExit(0 if report['passed'] else 1)
