#!/usr/bin/env python3
"""Versioned SOURCE protocol; import performs no I/O.

No executable production CLI until the exact immutable211 orchestrator and
independent resource/admission proofs are bound. Tests use tiny private files.
Original checkpoint is read-only and never removed or overwritten here.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import stat
import time
import uuid

SQLITE_LOCK_OFFSET = 0x40000000
SQLITE_LOCK_LENGTH = 512
BLOCK = 1024 * 1024
MAX_RECORD_BYTES = 32768
WRITE_MILESTONE = 'TARGET_WRITES_ADMITTED.json'


class Hold(RuntimeError):
    """No driver/path/customer contents cross a public boundary."""


def require(condition, code):
    if not condition:
        raise Hold(code)


def identity(fd):
    s = os.fstat(fd)
    require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'not_single_regular_inode')
    # Decimal strings preserve64-bit inode/device/size identity in Node JSON.
    return dict(device=str(s.st_dev), inode=str(s.st_ino), uid=str(s.st_uid), bytes=str(s.st_size),
                allocatedBytes=str(s.st_blocks * 512))


def private_directory(root):
    root = Path(root)
    require(root.is_absolute() and os.path.normpath(root) == str(root), 'invalid_root')
    current = Path('/')
    for part in root.parts[1:]:
        current /= part
        s = os.lstat(current)
        require(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode), 'directory_alias')
    s = os.lstat(root)
    require(s.st_uid == os.getuid() and stat.S_IMODE(s.st_mode) == 0o700, 'private_root_required')
    return root


def sync_directory(root):
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def read_record(file):
    fd = os.open(file, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        s = os.fstat(fd)
        require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and s.st_size <= MAX_RECORD_BYTES, 'record_identity_or_size')
        raw = os.read(fd, MAX_RECORD_BYTES + 1)
        require(len(raw) == s.st_size, 'short_record')
        return json.loads(raw)
    finally:
        os.close(fd)


def write_record(root, name, value, replace=False):
    require('/' not in name and name not in ('', '.', '..'), 'record_name')
    raw = (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()
    require(len(raw) <= MAX_RECORD_BYTES, 'record_bound')
    temporary = root / (name + '.next-' + str(uuid.uuid4())) if replace else root / name
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        offset = 0
        while offset < len(raw):
            n = os.write(fd, raw[offset:])
            require(n > 0, 'short_record_write')
            offset += n
        os.fsync(fd)
    finally:
        os.close(fd)
    if replace:
        os.replace(temporary, root / name)
    sync_directory(root)


class Control:
    """Same mkdir lock format is used by the Node application entry gate.

    An abandoned lock is a HOLD requiring exact Root-owned process/container
    closure review. No automatic stale-lock takeover, deletion or retry.
    """
    def __init__(self, root, run_id):
        self.root = private_directory(root)
        self.run_id = run_id
        self.lock = self.root / 'protocol-lock'
        self.token = None
        self.lock_inode = None
        self.lock_device = None
        self.active = False
        self.owner_pid = None
        self.owner_ticks = None

    def __enter__(self):
        require(not self.active and self.token is None, 'control_already_entered')
        try:
            os.mkdir(self.lock, 0o700)
        except FileExistsError as error:
            raise Hold('control_locked_requires_exact_inspection') from error
        self.token = str(uuid.uuid4())
        s = os.lstat(self.lock)
        self.lock_inode, self.lock_device = s.st_ino, s.st_dev
        ticks = Path('/proc/self/stat').read_text().split(') ')[-1].split()[19]
        self.owner_pid, self.owner_ticks = os.getpid(), ticks
        write_record(self.lock, 'owner.json', dict(token=self.token, runId=self.run_id,
                     pid=os.getpid(), startTicks=ticks, processGroup=os.getpgrp()))
        sync_directory(self.root)
        self.active = True
        return self

    def assert_owned(self):
        require(self.active and self.token is not None, 'control_not_held')
        private_directory(self.root)
        s = os.lstat(self.lock)
        require(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode)
                and s.st_ino == self.lock_inode and s.st_dev == self.lock_device,
                'control_inode_changed')
        owner = read_record(self.lock / 'owner.json')
        ticks = Path('/proc/self/stat').read_text().split(') ')[-1].split()[19]
        require(owner.get('token') == self.token and owner.get('runId') == self.run_id
                and owner.get('pid') == self.owner_pid == os.getpid()
                and owner.get('startTicks') == self.owner_ticks == ticks,
                'control_owner_changed')

    def __exit__(self, *unused):
        # Failed cleanup keeps a lock; it never removes an unrecognized owner.
        try:
            self.assert_owned()
            os.unlink(self.lock / 'owner.json')
            os.rmdir(self.lock)
            sync_directory(self.root)
        finally:
            self.active = False
            self.token = None

    def state(self):
        self.assert_owned()
        value = read_record(self.root / 'state.json')
        require(value.get('runId') == self.run_id and value.get('version') == 1, 'state_binding')
        require(value.get('nativeTargetContract') == 'news0227_211_v1'
                and value.get('targetCount') == 211, 'exact211_protocol_contract_required')
        return value

    def assert_no_target_writes(self):
        self.assert_owned()
        # The durable milestone wins even if a crash prevented the state update.
        require(not os.path.lexists(self.root / WRITE_MILESTONE), 'post_write_copyback_forbidden')
        require(self.state()['phase'] != 'TARGET_WRITES_ADMITTED', 'post_write_copyback_forbidden')

    def transition(self, expected, phase, details):
        self.assert_owned()
        old = self.state()
        require(old['phase'] in expected, 'state_conflict')
        new = {**old, **details, 'phase': phase, 'sequence': old['sequence'] + 1}
        require(new['runId'] == self.run_id and new['version'] == 1, 'state_identity_change')
        require(new.get('nativeTargetContract') == 'news0227_211_v1'
                and new.get('targetCount') == 211, 'exact211_protocol_contract_change')
        write_record(self.root, 'state.json', new, replace=True)
        return new


def hash_fd(fd, length, guard=lambda: None):
    h = hashlib.sha256()
    offset = 0
    while offset < length:
        guard()
        try:
            block = os.pread(fd, min(BLOCK, length - offset), offset)
        except InterruptedError:
            continue
        require(bool(block), 'short_hash_read')
        h.update(block)
        offset += len(block)
    require(os.fstat(fd).st_size == length, 'hash_length_drift')
    return h.hexdigest()


def stream_overwrite(source_fd, live_fd, source_identity, live_identity,
                     expected_sha256, length, max_growth, max_allocated_growth, guard=lambda: None):
    """Caller holds Control and the exact live POSIX SQLite-range lock.

    No opening/closing another descriptor for the live inode in this process:
    POSIX record locks can be released by closing ANY such descriptor.
    """
    require(identity(source_fd) == source_identity, 'source_identity_drift')
    require(identity(live_fd) == live_identity, 'live_identity_drift')
    require((source_identity['device'], source_identity['inode']) !=
            (live_identity['device'], live_identity['inode']), 'source_live_alias')
    require(length == int(source_identity['bytes']) and length > 0, 'source_length')
    require(max(0, length - int(live_identity['bytes'])) <= max_growth, 'growth_bound')
    require(len(expected_sha256) == 64 and all(c in '0123456789abcdef' for c in expected_sha256), 'source_hash')
    source_flags, live_flags = fcntl.fcntl(source_fd, fcntl.F_GETFL), fcntl.fcntl(live_fd, fcntl.F_GETFL)
    require(source_flags & os.O_ACCMODE == os.O_RDONLY, 'source_not_readonly')
    require(live_flags & os.O_ACCMODE == os.O_RDWR and not live_flags & os.O_APPEND,
            'live_not_random_access_readwrite')
    # A stale stored receipt or corrupted source must fail BEFORE any live byte
    # is changed. The stream hash remains an independent change-during-copy check.
    require(hash_fd(source_fd, length, guard) == expected_sha256, 'source_prewrite_hash')
    h = hashlib.sha256()
    offset = 0
    while offset < length:
        guard()
        try:
            block = os.pread(source_fd, min(BLOCK, length - offset), offset)
        except InterruptedError:
            continue
        require(bool(block), 'short_copy_read')
        h.update(block)
        done = 0
        while done < len(block):
            guard()
            require(not fcntl.fcntl(live_fd, fcntl.F_GETFL) & os.O_APPEND, 'live_append_flag_changed')
            try:
                n = os.pwrite(live_fd, block[done:], offset + done)
            except InterruptedError:
                continue
            require(n > 0, 'short_copy_write')
            done += n
        require(os.fstat(live_fd).st_blocks * 512 <= int(live_identity['allocatedBytes']) + max_allocated_growth,
                'physical_allocation_budget_exceeded')
        offset += len(block)
    require(h.hexdigest() == expected_sha256, 'source_stream_hash_changed')
    require(identity(source_fd) == source_identity, 'source_changed_during_copy')
    # Shrinking before successful transfer would destroy uncopied original data.
    os.ftruncate(live_fd, length)
    os.fsync(live_fd)
    require(os.fstat(live_fd).st_blocks * 512 <= int(live_identity['allocatedBytes']) + max_allocated_growth,
            'physical_allocation_budget_exceeded')
    require(hash_fd(live_fd, length, guard) == expected_sha256, 'installed_readback_hash')
    after = identity(live_fd)
    require(all(after[k] == live_identity[k] for k in ('device', 'inode', 'uid')), 'live_inode_changed')
    return dict(bytes=length, sha256=expected_sha256, liveIdentity=after)


def transfer(control, action, source_fd, live_fd, expected_sha256, max_growth,
             original_source_identity, expected_live_identity, deadline_ms, custody_guard=lambda: None):
    """Install/copyback protocol, usable ONLY within an already-held Control.

    Actual orchestrator must prove complete namespace/FD/sidecar/process/volume
    custody and real capacity BEFORE this call. Range-lock success alone is not
    a complete proof against non-SQLite raw writers or opaque namespaces.
    """
    control.assert_owned()
    require(action in ('install', 'copyback'), 'unknown_transfer')
    control.assert_no_target_writes()
    before = control.state()
    original_live = before['originalLiveIdentity']
    require(all(expected_live_identity[k] == original_live[k] for k in ('device', 'inode', 'uid')),
            'wrong_original_live_inode')
    expected_source = before['offlineTargetIdentity'] if action == 'install' else before['originalBackupIdentity']
    expected_hash = before['offlineTargetSha256'] if action == 'install' else before['originalBackupSha256']
    require(original_source_identity == expected_source and expected_sha256 == expected_hash,
            'source_not_bound_to_verified_state')
    allocation = before['physicalAllocationContract']
    require(allocation.get('coversExistingSparseHolesAndRollback') is True
            and len(allocation.get('reviewSha256', '')) == 64, 'physical_allocation_not_reviewed')
    allocation_growth = int(allocation['installAdditionalAllocatedBytes' if action == 'install'
                                      else 'copybackAdditionalAllocatedBytes'])
    require(allocation_growth >= 0, 'physical_allocation_bound')
    allowed = ('OFFLINE_TARGET_VERIFIED',) if action == 'install' else (
        'INSTALLING', 'INSTALL_FAILED', 'INSTALL_HASH_VERIFIED', 'TARGET_VERIFIED',
        'COPYBACK_IN_PROGRESS', 'COPYBACK_FAILED')
    require(before['phase'] in allowed, 'transfer_phase')
    require(identity(live_fd) == expected_live_identity, 'initial_live_identity')
    require(identity(source_fd) == original_source_identity, 'initial_source_identity')
    # This conflicts with SQLite readers/writers in OTHER processes and is
    # acquired before persisting install intent or changing a single live byte.
    try:
        fcntl.lockf(live_fd, fcntl.LOCK_EX | fcntl.LOCK_NB,
                    SQLITE_LOCK_LENGTH, SQLITE_LOCK_OFFSET, os.SEEK_SET)
    except BlockingIOError as error:
        raise Hold('sqlite_reader_or_writer_still_active') from error
    try:
        control.assert_no_target_writes()
        start_phase = 'INSTALLING' if action == 'install' else 'COPYBACK_IN_PROGRESS'
        target_phase = 'INSTALL_HASH_VERIFIED' if action == 'install' else 'ORIGINAL_HASH_VERIFIED'
        failed_phase = 'INSTALL_FAILED' if action == 'install' else 'COPYBACK_FAILED'

        def guard():
            # Recovery may continue beyond the admission deadline to restore a
            # safe original. A fresh install cannot admit work after cutoff.
            if action == 'install':
                require(time.time() * 1000 < deadline_ms, 'owner_window_reached')
            control.assert_no_target_writes()
            custody_guard()

        guard()
        control.transition(allowed, start_phase, dict(transferAction=action,
                           sourceIdentity=original_source_identity,
                           expectedTransferSha256=expected_sha256,
                           liveIdentity=expected_live_identity))
        try:
            result = stream_overwrite(source_fd, live_fd, original_source_identity,
                                      expected_live_identity, expected_sha256,
                                      int(original_source_identity['bytes']), max_growth, allocation_growth, guard)
        except BaseException:
            # The already-durable INSTALLING intent remains authoritative even
            # if this supplementary failure receipt itself cannot be written.
            control.transition((start_phase,), failed_phase, dict(requiresIndependentInspection=True))
            raise
        control.transition((start_phase,), target_phase, dict(transferResult=result,
                           requiresFullReadOnlySqlVerification=True))
        return result
    finally:
        fcntl.lockf(live_fd, fcntl.LOCK_UN, SQLITE_LOCK_LENGTH, SQLITE_LOCK_OFFSET, os.SEEK_SET)


if __name__ == '__main__':
    # A generic path/JSON CLI would bypass the as-yet-unbound target/custody
    # orchestrator. Keep this library uninvokable as a production command.
    raise SystemExit('combined211_protocol_requires_reviewed_exact_orchestrator')
