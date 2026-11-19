#!/usr/bin/env python3
"""Exact Root-reviewed raw install/copyback driver. No SQLite/app/native import.

Read-only preparation/verification is a separate finite Node invocation. This
driver opens exactly one live FD, excludes every other reader/map, obtains the
actual SQLite byte-range lock, and never removes a backup, sidecar, or source.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import sys
import time

_spec = importlib.util.spec_from_file_location('copy210', Path(__file__).with_name('combined-210-copy-protocol-20261119.py'))
p = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(p)


def no_links(file):
    file = Path(file)
    p.require(file.is_absolute() and os.path.normpath(file) == str(file), 'nonliteral_file_path')
    current = Path('/')
    for part in file.parts[1:]:
        current /= part
        s = os.lstat(current)
        p.require(not stat.S_ISLNK(s.st_mode), 'file_parent_alias')
        if current != file:
            p.require(stat.S_ISDIR(s.st_mode), 'file_parent_not_directory')
    p.require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'file_not_single_regular')
    return s


def no_payload_sidecars(file):
    for suffix in ('-journal', '-wal'):
        sidecar = str(file) + suffix
        if os.path.lexists(sidecar):
            p.require(no_links(sidecar).st_size == 0, 'sidecar_payload_requires_inspection')
    # Even an empty original SHM can pair stale locks with replaced bytes.
    # Exact Root-controlled inactive-sidecar disposition must precede raw copy;
    # this driver never deletes or renames it to force admission.
    p.require(not os.path.lexists(str(file) + '-shm'), 'shm_requires_owned_disposition')


def scan_custody(identities, allowed_fds):
    pairs = {(int(s['device']), int(s['inode'])) for s in identities}
    self_pid = os.getpid()
    for entry in Path('/proc').iterdir():
        if not entry.name.isdecimal():
            continue
        pid = int(entry.name)
        try:
            for fd in (entry / 'fd').iterdir():
                try:
                    s = os.stat(fd)
                except FileNotFoundError:
                    continue
                if (s.st_dev, s.st_ino) in pairs:
                    p.require(pid == self_pid and int(fd.name) in allowed_fds,
                              'foreign_or_extra_descriptor')
            for line in (entry / 'maps').read_text().splitlines():
                fields = line.split(maxsplit=5)
                major, minor = fields[3].split(':')
                pair = (os.makedev(int(major, 16), int(minor, 16)), int(fields[4]))
                p.require(pair not in pairs, 'database_memory_mapping_still_active')
        except FileNotFoundError:
            # A process that has fully exited no longer holds an inode. PID
            # start/namespace custody is independently bound in the Root receipt.
            continue
        except PermissionError as error:
            raise p.Hold('opaque_process_custody_requires_inspection') from error


def run(config_path, expected_config_sha):
    raw = Path(config_path).read_bytes()
    p.require(len(raw) <= p.MAX_RECORD_BYTES and hashlib.sha256(raw).hexdigest() == expected_config_sha,
              'raw_driver_config_binding')
    cfg = json.loads(raw)
    p.require(cfg['kind'] == 'ROOT_REVIEWED210_RAW_TRANSFER', 'raw_driver_admission_kind')
    for key, value in dict(NODE_ENV='production', RAILWAY_PROJECT_ID='49fc9197-07c9-45c7-b528-57d0393c2cca',
                           RAILWAY_ENVIRONMENT_ID='666e1624-a1eb-4e94-8e16-5ed73ad4b4af',
                           RAILWAY_SERVICE_ID='fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb',
                           RAILWAY_DEPLOYMENT_ID=cfg['deployment'], RAILWAY_GIT_COMMIT_SHA=cfg['source']).items():
        p.require(os.environ.get(key) == value, 'raw_driver_wrong_target')
    p.require(cfg['databasePath'] == '/data/traderlink-platform.sqlite', 'raw_driver_wrong_live_path')
    p.require(cfg['ownerWindowEndUtc'] == '2026-11-19T10:00:00.000Z', 'raw_driver_owner_window')
    import datetime
    deadline_ms = int(datetime.datetime.fromisoformat(cfg['ownerWindowEndUtc'].replace('Z', '+00:00')).timestamp() * 1000)
    with p.Control(cfg['root'], cfg['runId']) as control:
        control.assert_no_target_writes()
        state = control.state()
        p.require(state['targetSource'] == cfg['source'] and state['targetSchemaSha256'] == cfg['schemaSha256'], 'raw_target_source')
        action = cfg['action']
        p.require(action in ('install', 'copyback'), 'raw_action')
        source_path = state['offlinePath'] if action == 'install' else state['originalBackupPath']
        source_id = state['offlineTargetIdentity'] if action == 'install' else state['originalBackupIdentity']
        source_sha = state['offlineTargetSha256'] if action == 'install' else state['originalBackupSha256']
        receipt = p.read_record(cfg['capacityReceiptPath'])
        p.require(receipt['kind'] == 'ROOT_STORAGE_REVIEWED210_RAW_CAPACITY' and receipt['runId'] == cfg['runId']
                  and receipt['deployment'] == cfg['deployment'] and receipt['action'] == action, 'raw_capacity_binding')
        for key in ('completeNamespaceAndVolumeWriterCustody', 'sparseFillAndCopybackCovered',
                    'filesystemMetadataAndCowCovered', 'oneChunkOvershootReserved'):
            p.require(receipt.get(key) is True, 'raw_capacity_incomplete')
        p.require(len(receipt['reviewSha256']) == 64, 'raw_capacity_review')
        observed = datetime.datetime.fromisoformat(receipt['observedAtUtc'].replace('Z', '+00:00')).timestamp() * 1000
        p.require(0 <= time.time() * 1000 - observed <= 60000, 'raw_capacity_stale')
        need = int(receipt['additionalPhysicalBytesIncludingCopybackAndOvershoot'])
        p.require(need >= 0 and os.statvfs('/data').f_bavail * os.statvfs('/data').f_frsize >= need,
                  'raw_capacity_bytes')
        if action == 'install':
            p.require(time.time() * 1000 + int(receipt['measuredRemainingOperationAndRecoveryUpperBoundMs']) < deadline_ms,
                      'raw_install_cannot_fit_actual_owner_window')
        for file in (source_path, cfg['databasePath'], state['originalBackupPath']):
            no_links(file)
            no_payload_sidecars(file)
        source_fd = os.open(source_path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
        live_fd = os.open(cfg['databasePath'], os.O_RDWR | os.O_NOFOLLOW | os.O_CLOEXEC)
        try:
            current_live = p.identity(live_fd)
            p.require(os.stat(cfg['databasePath']).st_ino == int(current_live['inode']), 'named_live_inode_drift')
            p.require(p.identity(source_fd) == source_id, 'raw_source_identity')
            scan_custody([current_live, source_id, state['originalBackupIdentity']], {source_fd, live_fd})
            if action == 'install':
                p.require(p.hash_fd(live_fd, int(current_live['bytes']), control.assert_owned) == state['originalLiveSha256'],
                          'old_live_changed_before_install')
            # Complete independent original hash recheck uses a distinct backup
            # inode; closing it cannot release the live inode's POSIX lock.
            original_fd = os.open(state['originalBackupPath'], os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
            try:
                p.require(p.identity(original_fd) == state['originalBackupIdentity'], 'original_backup_identity_drift')
                p.require(p.hash_fd(original_fd, int(state['originalBackupIdentity']['bytes']), control.assert_owned)
                          == state['originalBackupSha256'], 'original_backup_hash_drift')
            finally:
                os.close(original_fd)
            def guard_custody():
                for file in (source_path, cfg['databasePath']):
                    no_payload_sidecars(file)
                named = no_links(cfg['databasePath'])
                p.require(named.st_dev == int(current_live['device']) and named.st_ino == int(current_live['inode']),
                          'named_live_inode_drift')
                named_source = no_links(source_path)
                p.require(named_source.st_dev == int(source_id['device']) and named_source.st_ino == int(source_id['inode']),
                          'named_source_inode_drift')
                scan_custody([current_live, source_id, state['originalBackupIdentity']], {source_fd, live_fd})

            result = p.transfer(control, action, source_fd, live_fd, source_sha,
                                int(cfg['maxLogicalGrowthBytes']), source_id, current_live, deadline_ms, guard_custody)
            p.require(os.stat(cfg['databasePath']).st_ino == int(result['liveIdentity']['inode']), 'named_live_inode_changed')
            return result
        finally:
            os.close(live_fd)
            os.close(source_fd)


if __name__ == '__main__':
    try:
        p.require(len(sys.argv) == 3, 'raw_driver_arguments')
        result = run(sys.argv[1], sys.argv[2])
        print(json.dumps(dict(kind='EXACT210_RAW_TRANSFER_HASH_ONLY_NOT_SQL_VERIFICATION', result=result)))
    except BaseException:
        # Private durable intent remains authoritative. No database/secret/path
        # exception is exported and no automatic restore, cleanup or retry runs.
        print('combined210_raw_transfer_hold', file=sys.stderr)
        raise SystemExit(1)
