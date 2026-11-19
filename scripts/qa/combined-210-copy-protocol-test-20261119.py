#!/usr/bin/env python3
"""Meaningful NEW protocol boundaries; tiny synthetic byte files, no SQLite."""
import hashlib
import fcntl
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('copy210', BASE / 'platform/combined-210-copy-protocol-20261119.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
CONTROL = BASE / 'platform/combined-210-control-20261119.cjs'
cases = []


def passed(name):
    cases.append(name)


class Fixture:
    def __init__(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='tl210-protocol-synthetic-')
        self.root = Path(self.tmp.name)
        os.chmod(self.root, 0o700)
        self.run = 'synthetic-new-protocol-only'
        self.original = b'ORIGINAL_SYNTHETIC_' * 1024
        self.target = b'TARGET_SYNTHETIC_' * 2048
        for name, body in [('backup.bin', self.original), ('live.bin', self.original), ('target.bin', self.target)]:
            (self.root / name).write_bytes(body)
        self.backup = os.open(self.root / 'backup.bin', os.O_RDONLY | os.O_NOFOLLOW)
        self.live = os.open(self.root / 'live.bin', os.O_RDWR | os.O_NOFOLLOW)
        self.target_fd = os.open(self.root / 'target.bin', os.O_RDONLY | os.O_NOFOLLOW)
        self.original_identity = p.identity(self.backup)
        self.live_identity = p.identity(self.live)
        self.target_identity = p.identity(self.target_fd)
        self.original_sha = hashlib.sha256(self.original).hexdigest()
        self.target_sha = hashlib.sha256(self.target).hexdigest()
        p.write_record(self.root, 'state.json', dict(version=1, runId=self.run, phase='OFFLINE_TARGET_VERIFIED', sequence=0,
                       originalLiveIdentity=self.live_identity, originalBackupIdentity=self.original_identity,
                       originalBackupSha256=self.original_sha, offlineTargetIdentity=self.target_identity,
                       offlineTargetSha256=self.target_sha, physicalAllocationContract=dict(coversExistingSparseHolesAndRollback=True,
                       reviewSha256='8' * 64, installAdditionalAllocatedBytes=str(1024 * 1024),copybackAdditionalAllocatedBytes=str(1024 * 1024)),
                       qualifiedRecoveryImages=[dict(source='synthetic-source',
                       schemaSha256='2' * 64, imageDigest='sha256:' + '4' * 64, installedImageReviewSha256='5' * 64)]))

    def copy(self, action='install', expected=None):
        fd = self.target_fd if action == 'install' else self.backup
        ident = self.target_identity if action == 'install' else self.original_identity
        digest = expected or (self.target_sha if action == 'install' else self.original_sha)
        with p.Control(self.root, self.run) as control:
            return p.transfer(control, action, fd, self.live, digest, 1024 * 1024,
                              ident, p.identity(self.live), int(time.time() * 1000) + 10000)

    def node(self, name, extra=None, expect_success=True):
        value = dict(root=str(self.root), runId=self.run, source='synthetic-source', schemaSha256='2' * 64,
                     imageDigest='sha256:' + '3' * 64, admissionReceiptSha256='6' * 64,
                     actualRuntimeOrdinaryAccountAndCatalogQualified=True)
        value.update(extra or {})
        code = 'const c=require(process.argv[1]);const x=JSON.parse(process.argv[2]);try{c[process.argv[3]](x);process.stdout.write("ok");}catch{process.exitCode=7;}'
        done = subprocess.run(['node', '-e', code, str(CONTROL), json.dumps(value), name], capture_output=True, text=True, timeout=5)
        assert done.returncode == (0 if expect_success else 7), done.stderr

    def mark_verified(self):
        self.node('markTargetVerified', dict(verificationReceiptSha256='7' * 64, readOnlyVerification=dict(
            kind='EXACT210_INSTALLED_READONLY_VERIFICATION', runId=self.run, source='synthetic-source',
            schemaSha256='2' * 64, count=210, liveIdentity=p.identity(self.live), fileSha256=self.target_sha,
            fullLedgerOriginalPrefixAndDataPreserved=True, foreignKeys='ok', quickCheck='ok', applicationOrAuthOrProviderWrites=0)))

    def close(self):
        for fd in (self.backup, self.live, self.target_fd):
            os.close(fd)
        self.tmp.cleanup()


def expect_hold(fn):
    try:
        fn()
    except p.Hold:
        return
    raise AssertionError('expected protocol refusal')


f = Fixture()
try:
    f.copy()
    assert (f.root / 'live.bin').read_bytes() == f.target
    assert p.identity(f.live)['inode'] == f.live_identity['inode']
    assert (f.root / 'backup.bin').read_bytes() == f.original
    assert p.read_record(f.root / 'state.json')['phase'] == 'INSTALL_HASH_VERIFIED'
    passed('install preserves existing inode and untouched original backup; full hash readback')
    f.copy('copyback')
    assert (f.root / 'live.bin').read_bytes() == f.original and os.fstat(f.live).st_size == len(f.original)
    passed('pre-write copyback restores exact bytes and length in same live inode')
finally:
    f.close()

f = Fixture()
try:
    expect_hold(lambda: f.copy(expected='0' * 64))
    assert (f.root / 'live.bin').read_bytes() == f.original
    passed('wrong source binding refuses before modifying live bytes')
    state = p.read_record(f.root / 'state.json')
    state['offlineTargetSha256'] = '0' * 64
    p.write_record(f.root, 'state.json', state, replace=True)
    expect_hold(lambda: f.copy(expected='0' * 64))
    assert p.read_record(f.root / 'state.json')['phase'] == 'INSTALL_FAILED'
    f.copy('copyback')
    assert (f.root / 'live.bin').read_bytes() == f.original
    assert (f.root / 'live.bin').read_bytes() == f.original
    passed('source prehash rejects corruption before any live byte is changed; original remains recoverable')
finally:
    f.close()

f = Fixture()
reader = None
try:
    code = 'import os,fcntl,sys;fd=os.open(sys.argv[1],os.O_RDONLY);fcntl.lockf(fd,fcntl.LOCK_SH,512,0x40000000,os.SEEK_SET);print("ready",flush=True);sys.stdin.readline();os.close(fd)'
    reader = subprocess.Popen(['python3', '-c', code, str(f.root / 'live.bin')], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    assert reader.stdout.readline().strip() == 'ready'
    expect_hold(f.copy)
    assert (f.root / 'live.bin').read_bytes() == f.original
    assert p.read_record(f.root / 'state.json')['phase'] == 'OFFLINE_TARGET_VERIFIED'
    passed('actual competing process SQLite-range reader lock blocks first live write')
finally:
    if reader:
        reader.communicate('\n', timeout=5)
        assert reader.returncode == 0
    f.close()

f = Fixture()
try:
    f.copy()
    f.mark_verified()
    with p.Control(f.root, f.run):
        f.node('admitTargetWrites', expect_success=False)
    assert not (f.root / p.WRITE_MILESTONE).exists()
    passed('Node write admission and Python copyback serialize with same atomic directory lock')
    f.node('admitTargetWrites', dict(actualRuntimeOrdinaryAccountAndCatalogQualified=False), expect_success=False)
    assert not (f.root / p.WRITE_MILESTONE).exists()
    passed('ordinary-account/catalog unqualified state cannot admit any target writes')
    f.node('admitTargetWrites')
    f.node('admitTargetWrites', dict(actualRuntimeOrdinaryAccountAndCatalogQualified=False), expect_success=False)
    expect_hold(lambda: f.copy('copyback'))
    assert (f.root / 'live.bin').read_bytes() == f.target
    passed('durable target-write admission forbids original checkpoint copyback')
    state = p.read_record(f.root / 'state.json')
    state['phase'] = 'TARGET_VERIFIED'  #simulate crash between milestone+state fsync
    p.write_record(f.root, 'state.json', state, replace=True)
    expect_hold(lambda: f.copy('copyback'))
    f.node('admitTargetWrites')
    assert p.read_record(f.root / 'state.json')['phase'] == 'TARGET_WRITES_ADMITTED'
    passed('milestone wins after crash before state update and restart cannot reopen rollback')
    f.node('admitForwardTargetWrites', dict(imageDigest='sha256:' + '4' * 64, current210ReadOnlyStructureVerified=True))
    expect_hold(lambda: f.copy('copyback'))
    passed('reviewed compatible forward recovery retains irreversible no-copyback boundary')
    f.node('admitForwardTargetWrites', dict(imageDigest='sha256:' + '9' * 64, current210ReadOnlyStructureVerified=True), expect_success=False)
    passed('unreviewed forward image is refused')
finally:
    f.close()

f = Fixture()
try:
    with p.Control(f.root, f.run) as expired:
        pass
    expect_hold(lambda: p.transfer(expired, 'install', f.target_fd, f.live, f.target_sha, 1024 * 1024,
                                  f.target_identity, f.live_identity, int(time.time() * 1000) + 10000))
    assert (f.root / 'live.bin').read_bytes() == f.original
    passed('expired Python control cannot mutate after releasing its actual lock')
    flags = fcntl.fcntl(f.live, fcntl.F_GETFL)
    fcntl.fcntl(f.live, fcntl.F_SETFL, flags | os.O_APPEND)
    expect_hold(f.copy)
    assert (f.root / 'live.bin').read_bytes() == f.original
    fcntl.fcntl(f.live, fcntl.F_SETFL, flags)
    passed('O_APPEND descriptor refuses before live write rather than appending despite pwrite offset')
finally:
    f.close()

f = Fixture()
try:
    f.copy()
    f.mark_verified()
    f.node('admitNativeSetupWrites', dict(actualSignedConfigurationAndCatalogQualified=True,
                                        genuineOwnerSessionCustodyConfirmed=True))
    barrier = (f.root / p.WRITE_MILESTONE).read_bytes()
    expect_hold(lambda: f.copy('copyback'))
    f.node('admitTargetWrites', expect_success=False)
    state = p.read_record(f.root / 'state.json')
    state['qualifiedRecoveryImages'].append(dict(source='synthetic-source', schemaSha256='2' * 64,
        imageDigest='sha256:' + '3' * 64, installedImageReviewSha256='5' * 64))
    p.write_record(f.root, 'state.json', state, replace=True)
    f.node('admitForwardTargetWrites', dict(admissionReceiptSha256='a' * 64, current210ReadOnlyStructureVerified=True))
    assert not p.read_record(f.root / 'state.json')['nativeSetupPending']
    assert (f.root / p.WRITE_MILESTONE).read_bytes() == barrier
    expect_hold(lambda: f.copy('copyback'))
    passed('same-image native setup transitions under a distinct qualified receipt without replacing original barrier')
finally:
    f.close()

f = Fixture()
try:
    keeper = BASE / 'platform/combined-210-keeper-20261119.cjs'
    code = '''const fs=require('node:fs'),a=require('node:assert/strict'),c=require(process.argv[1]),k=require(process.argv[2]);
    const root=process.argv[3],runId=process.argv[4];let constructed=0;
    const input={root,role:{runId,applicationSource:'synthetic-source',schemaSha256:'2'.repeat(64)},activation:{}};
    a.throws(()=>k.activateVerifiedTarget(input,()=>{constructed++;throw Error('must not load');}));a.equal(constructed,0);
    let saved;c.locked(root,runId,lease=>{saved=lease;a.throws(()=>c.locked(root,runId,()=>{}));});
    a.throws(()=>c.admitTargetWrites({root,runId,controlLease:saved}));
    const before=fs.readFileSync(root+'/state.json');fs.writeFileSync(root+'/state.json','corrupt');
    let response;k.maintenanceHandler({root,runId,role:'final210',deployment:'fixture'})({method:'GET',url:'/api/platform/health'},
      {writeHead(s){a.equal(s,200)},end(x){response=JSON.parse(x)}});
    a.equal(response.phase,'UNKNOWN_REQUIRES_INSPECTION');a.equal(response.databaseOpened,false);
    fs.unlinkSync(root+'/state.json');
    k.maintenanceHandler({root,runId,role:'final210',deployment:'fixture'})({method:'GET',url:'/api/platform/health'},
      {writeHead(s){a.equal(s,200)},end(x){response=JSON.parse(x)}});a.equal(response.databaseOpened,false);
    fs.writeFileSync(root+'/state.json',before);'''
    done = subprocess.run(['node', '-e', code, str(CONTROL), str(keeper), str(f.root), f.run],
                          capture_output=True, text=True, timeout=5)
    assert done.returncode == 0, done.stderr
    passed('unsafe phase never constructs verifier; missing or corrupt state serves HOLD without SQLite; expired Node lease rejected')
    with p.Control(f.root, f.run):
        code = '''const a=require('node:assert/strict'),k=require(process.argv[1]);let constructed=0;
        a.throws(()=>k.activateVerifiedTarget({root:process.argv[2],role:{runId:process.argv[3]},activation:{}},()=>{constructed++;}));
        a.equal(constructed,0);'''
        done = subprocess.run(['node', '-e', code, str(keeper), str(f.root), f.run], capture_output=True, text=True, timeout=5)
        assert done.returncode == 0, done.stderr
    passed('real Python install lock prevents keeper verifier construction in a separate Node process')
finally:
    f.close()

f = Fixture()
real_write = os.pwrite
try:
    calls = 0
    def short_eintr(fd, data, offset):
        global calls
        calls += 1
        if calls == 1:
            raise InterruptedError('synthetic signal')
        return real_write(fd, data[:137], offset)
    os.pwrite = short_eintr
    f.copy()
    assert calls > 100 and (f.root / 'live.bin').read_bytes() == f.target
    passed('actual short writes and injected EINTR are retried with exact offsets and full readback')
finally:
    os.pwrite = real_write
    f.close()

f = Fixture()
try:
    calls = 0
    def cancel_after_first_write(fd, data, offset):
        global calls
        calls += 1
        if calls == 2:
            raise KeyboardInterrupt('synthetic mid-copy cancellation')
        return real_write(fd, data[:137], offset)
    os.pwrite = cancel_after_first_write
    try:
        f.copy()
        raise AssertionError('cancellation missing')
    except KeyboardInterrupt:
        pass
    assert p.read_record(f.root / 'state.json')['phase'] == 'INSTALL_FAILED'
    assert (f.root / 'backup.bin').read_bytes() == f.original
    os.pwrite = real_write
    f.copy('copyback')
    assert (f.root / 'live.bin').read_bytes() == f.original
    passed('mid-copy cancellation leaves durable failed state and intact original; explicit copyback restores bytes')
finally:
    os.pwrite = real_write
    f.close()

print(json.dumps(dict(kind='NEW210_SOURCE_PROTOCOL_TINY_SYNTHETIC_BOUNDARIES_ONLY', cases=cases, count=len(cases),
                     databaseOrNativeSqlOrHostedExecution=False, allChildrenReaped=True)))
