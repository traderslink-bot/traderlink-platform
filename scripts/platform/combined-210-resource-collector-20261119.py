#!/usr/bin/env python3
"""Bounded metadata evidence, NEVER a copy/admission decision.

Run with python3 -I -B. No environment/cmdline, database/file payload, key,
network, subprocess, mutation, lock acquisition or service-control operations.
Only explicit JSON metadata inputs and /proc /sys resource metadata are read.
Image emission needs an independently materialized FINAL image filesystem;
a live '/' with child mounts is deliberately rejected as an image census.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import signal
import stat
import time

MAX_JSON = 64 * 1024 * 1024
HARD = {'wallSeconds': 120, 'maxEntries': 250000, 'maxProcesses': 128,
        'maxTasks': 2048, 'maxFdsPerTask': 4096, 'maxMapLinesPerTask': 8192,
        'maxMounts': 512, 'maxOutputBytes': 131072, 'maxDepth': 64}
KERNEL_FS = {'proc', 'sysfs', 'cgroup', 'cgroup2', 'devpts', 'mqueue', 'securityfs',
             'pstore', 'debugfs', 'tracefs', 'fusectl', 'configfs', 'bpf', 'nsfs',
             'binfmt_misc', 'rpc_pipefs'}
MEMORY_FS = {'tmpfs', 'ramfs', 'hugetlbfs'}
PROJECT = '49fc9197-07c9-45c7-b528-57d0393c2cca'
ENVIRONMENT = '666e1624-a1eb-4e94-8e16-5ed73ad4b4af'
SERVICE = 'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb'
LIVE = '/data/traderlink-platform.sqlite'


class Stop(Exception):
    pass


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


def require(value, message):
    if not value:
        raise Stop(message)


def literal(path):
    require(isinstance(path, str) and path.startswith('/') and os.path.normpath(path) == path
            and len(os.fsencode(path)) <= 4096, 'nonliteral_or_overlong_path')
    return path


def identity(s):
    return [s.st_dev, s.st_ino, stat.S_IFMT(s.st_mode), s.st_uid, s.st_gid,
            stat.S_IMODE(s.st_mode), s.st_size, s.st_blocks * 512, s.st_nlink,
            s.st_mtime_ns, s.st_ctime_ns]


def unescape(text):
    return re.sub(r'\\([0-7]{3})', lambda m: chr(int(m.group(1), 8)), text)


class Evidence:
    def __init__(self, limits=None):
        self.limits = dict(HARD)
        self.limits['wallSeconds'] = 60
        for name, value in (limits or {}).items():
            require(name in HARD and isinstance(value, int) and not isinstance(value, bool)
                    and 1 <= value <= HARD[name], 'invalid_limit')
            self.limits[name] = value
        require(self.limits['maxOutputBytes'] >= 1024, 'output_limit_below_metadata_error_record')
        self.started = time.monotonic()
        self.unknowns = []
        self.unknown_count = 0
        self.entries = 0
        self.inodes = {}
        self.ram_devices = set()
        self.persistent_devices = set()
        self.references = []
        self.reference_count = 0
        self.partial = {}

    def tick(self):
        if time.monotonic() - self.started > self.limits['wallSeconds']:
            raise Stop('wall_time_limit')

    def unknown(self, code, subject='', error=None):
        self.unknown_count += 1
        if len(self.unknowns) < 64:
            row = {'code': code, 'subject': str(subject)[:512]}
            if error is not None:
                row['errno'] = getattr(error, 'errno', None)
            self.unknowns.append(row)

    def read(self, path, maximum=1024 * 1024, expected_stat=None):
        """Only call at explicit metadata paths, NEVER FD/map-file targets."""
        self.tick()
        fd = os.open(path, os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW)
        try:
            if expected_stat is not None:
                require(identity(os.fstat(fd)) == identity(expected_stat), 'metadata_input_open_race')
            out = bytearray()
            while True:
                self.tick()
                b = os.read(fd, min(65536, maximum + 1 - len(out)))
                if not b:
                    break
                out.extend(b)
                require(len(out) <= maximum, 'metadata_input_limit')
            return bytes(out)
        finally:
            os.close(fd)

    def account(self, s, path, origin):
        if not (stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode) or stat.S_ISLNK(s.st_mode)):
            return
        key = (s.st_dev, s.st_ino)
        size = max(s.st_size, s.st_blocks * 512)
        old = self.inodes.get(key)
        if old:
            if old['size'] != s.st_size or old['allocated'] != s.st_blocks * 512:
                self.unknown('INODE_ALLOCATION_CHANGED', path)
            old['upper'] = max(old['upper'], size)
            if origin not in old['origins']:
                old['origins'].append(origin)
            return
        require(len(self.inodes) < self.limits['maxEntries'], 'inode_count_limit')
        persistent_path = path == '/data' or path.startswith('/data/')
        category = ('persistent' if s.st_dev in self.persistent_devices and persistent_path else
                    'memory' if s.st_dev in self.ram_devices else 'possible_container_quota')
        self.inodes[key] = {'device': s.st_dev, 'inode': s.st_ino, 'size': s.st_size,
                            'allocated': s.st_blocks * 512, 'upper': size,
                            'path': path[:4096], 'origins': [origin], 'category': category}

    def ref(self, value):
        self.reference_count += 1
        if len(self.references) < 48:
            self.references.append(value)

    def summary(self):
        rows = list(self.inodes.values())
        categories = {}
        for category in ('possible_container_quota', 'memory', 'persistent'):
            subset = [r for r in rows if r['category'] == category]
            categories[category] = {'uniqueInodes': len(subset),
                'logicalBytes': sum(r['size'] for r in subset),
                'allocatedBytes': sum(r['allocated'] for r in subset),
                'maxLogicalOrAllocatedBytes': sum(r['upper'] for r in subset)}
        h = hashlib.sha256()
        for row in sorted(rows, key=lambda r: (r['device'], r['inode'])):
            h.update(canonical(row) + b'\n')
        return {'categories': categories, 'uniqueInodeCount': len(rows),
                'inodeMetadataSha256': h.hexdigest(),
                'largestObservedInodes': sorted(rows, key=lambda r: r['upper'], reverse=True)[:12]}


def mounts(e, path='/proc/self/mountinfo'):
    raw = e.read(path)
    rows = []
    for line in raw.decode().splitlines():
        fields = line.split()
        separator = fields.index('-')
        require(separator >= 6 and len(fields) >= separator + 4, 'invalid_mountinfo')
        rows.append({'id': int(fields[0]), 'parent': int(fields[1]), 'device': fields[2],
                     'root': unescape(fields[3]), 'point': unescape(fields[4]),
                     'options': fields[5], 'type': fields[separator + 1],
                     'source': unescape(fields[separator + 2])})
    require(len(rows) <= e.limits['maxMounts'], 'mount_count_limit')
    return rows, sha(raw)


def fs_walk(e, root, excluded, account=True, image=False):
    """Directory-FD anchored, no symlink traversal, no regular-file opens."""
    literal(root)
    root_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW)
    root_stat = os.fstat(root_fd)
    digest = hashlib.sha256()
    rows = []
    local_count = 0

    def visit(fd, path, relative, depth=0):
        nonlocal local_count
        e.tick()
        require(depth <= e.limits['maxDepth'], 'filesystem_depth_limit')
        before = os.fstat(fd)
        require(before.st_dev == root_stat.st_dev, 'unexpected_walk_device')
        record(path, relative, before)
        with os.scandir(fd) as iterator:
            children = []
            for child in iterator:
                children.append(child)
                require(len(children) <= e.limits['maxEntries'], 'directory_entry_limit')
            children.sort(key=lambda item: item.name)
        for item in children:
            e.tick()
            child = os.path.join(path, item.name)
            rel = item.name if relative == '.' else os.path.join(relative, item.name)
            if child in excluded:
                continue
            s = os.stat(item.name, dir_fd=fd, follow_symlinks=False)
            require(s.st_dev == root_stat.st_dev, 'unclassified_device_crossing:' + child)
            if stat.S_ISDIR(s.st_mode):
                child_fd = os.open(item.name, os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW, dir_fd=fd)
                try:
                    require(identity(os.fstat(child_fd)) == identity(s), 'directory_identity_race')
                    visit(child_fd, child, rel, depth + 1)
                finally:
                    os.close(child_fd)
            else:
                record(child, rel, s)
        require(identity(os.fstat(fd)) == identity(before), 'directory_changed_during_walk:' + path)

    def record(path, relative, s):
        nonlocal local_count
        local_count += 1
        require(local_count <= e.limits['maxEntries'], 'filesystem_entry_limit')
        row = [relative, *identity(s)]
        digest.update(canonical(row) + b'\n')
        if account:
            e.account(s, path, 'filesystem_walk')
        if image:
            # Portable path + file metadata; build-device/inode retained for
            # independent hardlink accounting, never compared to runtime IDs.
            rows.append([relative, stat.S_IFMT(s.st_mode), s.st_size, s.st_blocks * 512,
                         s.st_dev, s.st_ino, s.st_nlink])
    try:
        visit(root_fd, root, '.')
    finally:
        os.close(root_fd)
    return {'root': root, 'device': root_stat.st_dev, 'inode': root_stat.st_ino,
            'entries': local_count, 'metadataSha256': digest.hexdigest()}, rows


def read_json_input(e, path, expected_sha, maximum, private=False):
    literal(path)
    current = '/'
    for part in Path(path).parts[1:]:
        current = os.path.join(current, part)
        s = os.lstat(current)
        require(not stat.S_ISLNK(s.st_mode), 'metadata_input_alias')
    require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'metadata_input_not_single_regular')
    require(0 < s.st_size <= maximum, 'metadata_input_file_size_limit')
    if private:
        require(s.st_uid == 0 and stat.S_IMODE(s.st_mode) == 0o600, 'config_not_root_private')
    raw = e.read(path, maximum, expected_stat=s)
    require(sha(raw) == expected_sha, 'metadata_input_sha_mismatch')
    require(identity(os.lstat(path)) == identity(s), 'metadata_input_changed')
    return json.loads(raw), len(raw)


def role_input(e, path, expected_sha):
    role, _ = read_json_input(e, path, expected_sha, 32768)
    require(role['projectId'] == PROJECT and role['environmentId'] == ENVIRONMENT
            and role['serviceId'] == SERVICE and role['databasePath'] == LIVE,
            'wrong_role_target')
    require(re.fullmatch('[a-f0-9]{40}', role['applicationSource']) is not None,
            'invalid_role_source')
    return role


def lease_observation(e, cfg):
    root = literal(cfg['protocolRoot'])
    require(root == '/data/backups/community-production210-' + cfg['runId'], 'protocol_path_binding')
    for parent in [*Path(root).parents, Path(root)]:
        ps = os.lstat(parent)
        require(stat.S_ISDIR(ps.st_mode) and not stat.S_ISLNK(ps.st_mode), 'protocol_ancestor_alias')
    s = os.lstat(root)
    require(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode)
            and s.st_uid == 0 and stat.S_IMODE(s.st_mode) == 0o700, 'protocol_root_not_root_private')
    owner_file = root + '/protocol-lock/owner.json'
    state_file = root + '/state.json'
    # These are operational ownership/state metadata, never key/DB contents.
    records = []
    for file in (owner_file, state_file):
        rs = os.lstat(file)
        require(stat.S_ISREG(rs.st_mode) and not stat.S_ISLNK(rs.st_mode) and rs.st_nlink == 1
                and rs.st_uid == 0 and stat.S_IMODE(rs.st_mode) == 0o600
                and 0 < rs.st_size <= 32768, 'protocol_metadata_identity_or_bound')
        records.append(json.loads(e.read(file, 32768, expected_stat=rs)))
    owner, state = records
    require(owner['runId'] == cfg['runId'] == state['runId'], 'protocol_run_mismatch')
    require(owner['pid'] == cfg['leaseOwnerPid'] and str(owner['startTicks']) == cfg['leaseOwnerStartTicks'], 'protocol_owner_mismatch')
    require(sha(owner['token'].encode()) == cfg['leaseOwnerTokenSha256'], 'protocol_token_mismatch')
    require(state['phase'] == cfg['expectedPhase'], 'protocol_phase_mismatch')
    lock = os.lstat(root + '/protocol-lock')
    require(stat.S_ISDIR(lock.st_mode) and not stat.S_ISLNK(lock.st_mode), 'protocol_lock_alias')
    stamp = e.read('/proc/' + str(owner['pid']) + '/stat', 8192).decode().rpartition(') ')[2].split()[19]
    require(stamp == cfg['leaseOwnerStartTicks'], 'lease_owner_pid_reused')
    return {'rootIdentity': identity(s), 'lockIdentity': identity(lock),
            'ownerRecordSha256': sha(canonical(owner)), 'stateRecordSha256': sha(canonical(state)),
            'pid': owner['pid'], 'startTicks': stamp, 'phase': state['phase']}


def file_reference(e, path, display, origin, pid, tid):
    # stat follows a proc magic link for metadata ONLY; never open/read target.
    s = os.stat(path)
    if stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode):
        e.account(s, display, origin)
        if s.st_nlink == 0 or s.st_dev in e.persistent_devices:
            e.ref({'pid': pid, 'tid': tid, 'kind': origin, 'path': display[:512],
                   'device': s.st_dev, 'inode': s.st_ino, 'bytes': s.st_size,
                   'allocatedBytes': s.st_blocks * 512, 'links': s.st_nlink})
        return (s.st_dev, s.st_ino, stat.S_IFMT(s.st_mode), s.st_size, s.st_blocks * 512)
    return None


def map_reference(e, line, task_root, pid, tid):
    fields = line.split(maxsplit=5)
    require(len(fields) >= 5, 'invalid_maps_record')
    address, _perms, _offset, device, inode = fields[:5]
    major, minor = device.split(':')
    key = (os.makedev(int(major, 16), int(minor, 16)), int(inode))
    if key[1] == 0:
        return None  # anonymous allocation belongs in observed cgroup memory.
    if key in e.inodes:
        return key
    display = unescape(fields[5]) if len(fields) == 6 else ''
    if display.startswith('/') and not display.endswith(' (deleted)'):
        try:
            s = os.stat(display)
            if (s.st_dev, s.st_ino) == key:
                e.account(s, display, 'mapped_file')
                return key
        except OSError:
            pass
    try:
        actual = file_reference(e, task_root + '/map_files/' + address, display,
                                'map_file_metadata', pid, tid)
        require(actual is not None and actual[:2] == key, 'map_file_identity_mismatch')
    except OSError as error:
        e.unknown('UNOBSERVABLE_MAPPED_FILE_ALLOCATION', f'{pid}/{tid}:{address}:{display}', error)
    return key


def process_snapshot(e, own_namespaces, own_root):
    own_cgroup = e.read('/proc/self/cgroup', 32768).decode().strip()
    pids = sorted(int(p.name) for p in Path('/proc').iterdir() if p.name.isdecimal())
    require(len(pids) <= e.limits['maxProcesses'], 'process_count_limit')
    observations = []
    total_tasks = 0
    signatures = []
    for pid in pids:
        e.tick()
        proc = '/proc/' + str(pid)
        try:
            tids = sorted(int(x.name) for x in Path(proc + '/task').iterdir() if x.name.isdecimal())
            for tid in tids:
                total_tasks += 1
                require(total_tasks <= e.limits['maxTasks'], 'task_count_limit')
                task = proc + '/task/' + str(tid)
                start = e.read(task + '/stat', 8192).decode().rpartition(') ')[2].split()[19]
                status = e.read(task + '/status', 32768).decode()
                uid = next(l.split()[1:] for l in status.splitlines() if l.startswith('Uid:'))
                gid = next(l.split()[1:] for l in status.splitlines() if l.startswith('Gid:'))
                cgroup = task_cgroup(e, task, pid, tid, own_cgroup)
                namespaces = {n: os.readlink(task + '/ns/' + n) for n in ('pid', 'mnt', 'user')}
                root_stat = os.stat(task + '/root')
                if namespaces != own_namespaces:
                    e.unknown('FOREIGN_TASK_NAMESPACE', f'{pid}/{tid}')
                if (root_stat.st_dev, root_stat.st_ino) != own_root:
                    e.unknown('FOREIGN_TASK_FILESYSTEM_ROOT', f'{pid}/{tid}')
                _mounts, mount_sha = mounts(e, task + '/mountinfo')
                regular_fds = []
                with os.scandir(task + '/fd') as entries:
                    fds = sorted(int(x.name) for x in entries if x.name.isdecimal())
                    require(len(fds) <= e.limits['maxFdsPerTask'], 'task_fd_limit')
                    for number in fds:
                        fd_path = task + '/fd/' + str(number)
                        target = os.readlink(fd_path)
                        value = file_reference(e, fd_path, target, 'process_fd', pid, tid)
                        if value:
                            regular_fds.append([number, *value])
                executable = os.readlink(task + '/exe')
                exe_stat = file_reference(e, task + '/exe', executable, 'process_executable', pid, tid)
                raw_maps = e.read(task + '/maps', 4 * 1024 * 1024)
                map_lines = raw_maps.decode().splitlines()
                require(len(map_lines) <= e.limits['maxMapLinesPerTask'], 'task_maps_limit')
                mapped = sorted({pair for line in map_lines
                                 if (pair := map_reference(e, line, task, pid, tid)) is not None})
                end_start = e.read(task + '/stat', 8192).decode().rpartition(') ')[2].split()[19]
                require(start == end_start, 'task_pid_reused_during_scan')
                observation = {'pid': pid, 'tid': tid, 'startTicks': start, 'uids': uid,
                               'gids': gid, 'namespaces': namespaces, 'mountInfoSha256': mount_sha,
                               'cgroupMembership': cgroup,
                               'regularFdCount': len(regular_fds), 'mappedFileCount': len(mapped),
                               'executable': executable[:512]}
                observations.append(observation)
                signatures.append([pid, tid, start, namespaces, mount_sha, cgroup, regular_fds, exe_stat, mapped])
        except OSError as error:
            e.unknown('PROCESS_METADATA_UNREADABLE_OR_CHANGED', str(pid), error)
    return {'pids': pids, 'tasks': total_tasks, 'collectorCgroupMembership': own_cgroup, 'observations': observations,
            'regularReferencesSha256': sha(canonical(signatures))}


def task_cgroup(e, task, pid, tid, own_cgroup):
    value = e.read(task + '/cgroup', 32768).decode().strip()
    if value != own_cgroup:
        e.unknown('TASK_CGROUP_DIFFERS_FROM_COLLECTOR_LIMIT_SCOPE', f'{pid}/{tid}')
    return value


def filesystem_stat(path):
    s = os.stat(path)
    v = os.statvfs(path)
    return {'path': path, 'device': s.st_dev, 'inode': s.st_ino,
            'blockSize': v.f_frsize, 'totalBytes': v.f_blocks * v.f_frsize,
            'availableBytes': v.f_bavail * v.f_frsize,
            'freeBytes': v.f_bfree * v.f_frsize}


def memory_metadata(e):
    raw = e.read('/proc/meminfo', 32768).decode()
    mem = {k: v.strip() for l in raw.splitlines()
           for k, _, v in [l.partition(':')] if k in {'MemTotal', 'MemAvailable', 'SwapTotal', 'SwapFree'}}
    out = {'procMeminfoHostOrNamespaceView': mem,
           'systemMemoryPressure': e.read('/proc/pressure/memory', 8192).decode().strip()}
    membership = e.read('/proc/self/cgroup', 32768).decode().splitlines()
    unified = [x.split(':', 2)[2] for x in membership if x.startswith('0::')]
    if len(unified) != 1:
        e.unknown('CGROUP_V2_MEMBERSHIP_NOT_AVAILABLE')
        return out
    rel = unified[0]
    require(rel.startswith('/') and '..' not in Path(rel).parts, 'cgroup_membership_escape')
    directory = Path('/sys/fs/cgroup') / rel.lstrip('/')
    out['cgroupMembership'] = rel
    out['visibleCgroupAncestors'] = []
    for _ in range(64):
        row = {'path': str(directory)}
        try:
            for name in ('memory.current', 'memory.max', 'memory.high', 'memory.swap.current',
                         'memory.swap.max', 'memory.events', 'memory.stat', 'memory.pressure', 'cgroup.procs'):
                row[name] = e.read(str(directory / name), 65536).decode().strip()
            out['visibleCgroupAncestors'].append(row)
        except OSError as error:
            e.unknown('CGROUP_MEMORY_METADATA_UNREADABLE', directory, error)
        if directory == Path('/sys/fs/cgroup'):
            break
        directory = directory.parent
    else:
        e.unknown('CGROUP_ANCESTOR_LIMIT')
    out['scope'] = 'Visible cgroup hierarchy only; hidden ancestor/provider constraints require Root reconciliation.'
    return out


def collect(e, cfg):
    require(os.getuid() == 0 and os.getgid() == 0, 'actual_production_root_actor_required')
    require(cfg['kind'] == 'ROOT210_READONLY_STORAGE_COLLECTION' and cfg['version'] == 1, 'config_kind')
    require(cfg['quotaBytes'] == '100000000000', 'unexpected_entitlement')
    require(re.fullmatch('[a-f0-9-]{36}', cfg['deploymentId']) is not None
            and re.fullmatch('sha256:[a-f0-9]{64}', cfg['imageDigest']) is not None,
            'invalid_supplied_deployment_or_image')
    require(cfg['rolePath'] == '/app/combined210-image-role.json'
            and cfg['imageCensusPath'] == '/app/combined210-image-census.json', 'unexpected_image_metadata_path')
    require(re.fullmatch('[a-f0-9-]{36}', cfg['runId']) is not None, 'invalid_run_id')
    out = {'kind': 'ROOT210_READONLY_RESOURCE_EVIDENCE_V1', 'source': cfg['source'],
           'runId': cfg['runId'], 'atUtc': dt.datetime.now(dt.timezone.utc).isoformat()}
    e.partial = out
    for key in ('imageCensusSha256', 'imageCensusReviewSha256', 'quotaEvidenceSha256', 'roleSha256'):
        require(re.fullmatch('[a-f0-9]{64}', cfg[key]) is not None, 'invalid_context_pin')
    role = role_input(e, cfg['rolePath'], cfg['roleSha256'])
    require(role['applicationSource'] == cfg['source'] and role['runId'] == cfg['runId'], 'role_source_or_run')
    require(role['expectedRuntimeUid'] == 0 and role['expectedRuntimeGid'] == 0, 'role_actor')
    require(role['role'] in ('final210', 'recovery210', 'maintenance210', 'transitional210'), 'role_kind')
    lease_before = lease_observation(e, cfg)
    out['protocolOwnerBefore'] = lease_before
    mount_rows, mounts_before = mounts(e)
    own_ns = {n: os.readlink('/proc/self/ns/' + n) for n in ('pid', 'mnt', 'user')}
    root_s = os.stat('/')
    own_root = (root_s.st_dev, root_s.st_ino)
    e.persistent_devices.add(os.stat('/data').st_dev)
    require(root_s.st_dev not in e.persistent_devices, 'root_and_data_share_device')
    extra_mounts = set(cfg.get('additionalQuotaDirectoryMounts', []))
    require(all(literal(x) == x for x in extra_mounts), 'quota_mount_path')
    walk_roots = ['/']
    for m in mount_rows:
        point = m['point']
        if point == '/':
            m['classification'] = 'container_root_visible_merged_filesystem'
            continue
        try:
            s = os.stat(point)
            if point == '/data' and m['type'] in KERNEL_FS | MEMORY_FS:
                e.unknown('DATA_MOUNT_IS_NOT_PERSISTENT_DISK', point)
            if m['type'] in KERNEL_FS:
                m['classification'] = 'kernel_metadata_filesystem'
            elif m['type'] in MEMORY_FS:
                m['classification'] = 'memory_backed_in_cgroup_not_root_disk'
                e.ram_devices.add(s.st_dev)
            elif point == '/data' or point.startswith('/data/'):
                m['classification'] = 'persistent_volume_excluded_from_ephemeral_total'
                e.persistent_devices.add(s.st_dev)
            elif stat.S_ISREG(s.st_mode):
                m['classification'] = 'bind_file_included_conservatively'
                e.account(s, point, 'mounted_regular_file')
            elif point in extra_mounts:
                m['classification'] = 'explicit_additional_quota_directory'
                walk_roots.append(point)
            else:
                m['classification'] = 'unknown_directory_mount'
                e.unknown('UNCLASSIFIED_DIRECTORY_MOUNT', point)
        except OSError as error:
            m['classification'] = 'unreadable_mount'
            e.unknown('MOUNT_METADATA_UNREADABLE', point, error)
    exclusions = {m['point'] for m in mount_rows if m['point'] != '/'}
    first_walks = [fs_walk(e, p, exclusions - {p})[0] for p in sorted(walk_roots)]
    out.update(mounts=mount_rows, filesystemWalksBefore=first_walks)
    first_processes = process_snapshot(e, own_ns, own_root)
    out['processSnapshotBefore'] = first_processes
    census, census_bytes = read_json_input(e, cfg['imageCensusPath'], cfg['imageCensusSha256'], MAX_JSON)
    require(census['kind'] == 'FINAL_IMAGE_METADATA_CENSUS_V1' and census['unknownCount'] == 0, 'image_census_incomplete')
    require(census['source'] == cfg['source'] and census['roleSha256'] == cfg['roleSha256'], 'image_census_wrong_source')
    require(census['postCensusArtifactReserveBytes'] == MAX_JSON, 'image_census_closure_reserve')
    require(len(census['entries']) <= e.limits['maxEntries'], 'image_census_entry_limit')
    require(census['materializedRoot']['entries'] == len(census['entries']), 'image_census_count_mismatch')
    unique = {}
    seen_paths = set()
    for row in census['entries']:
        require(isinstance(row, list) and len(row) == 7, 'image_metadata_shape')
        name, kind, size, allocated, device, inode, links = row
        require(isinstance(name, str) and name not in seen_paths and not name.startswith('/')
                and '..' not in Path(name).parts, 'image_metadata_path')
        require(all(isinstance(n, int) and not isinstance(n, bool) and n >= 0 for n in row[1:]), 'image_metadata_numbers')
        seen_paths.add(name)
        key = (device, inode)
        unique[key] = max(unique.get(key, 0), size, allocated)
    image_upper = sum(unique.values()) + MAX_JSON
    second_processes = process_snapshot(e, own_ns, own_root)
    second_walks = [fs_walk(e, p, exclusions - {p}, account=False)[0] for p in sorted(walk_roots)]
    if first_processes['regularReferencesSha256'] != second_processes['regularReferencesSha256']:
        e.unknown('PROCESS_OR_REGULAR_REFERENCE_CENSUS_CHANGED')
    if first_walks != second_walks:
        e.unknown('FILESYSTEM_METADATA_CHANGED_BETWEEN_FULL_WALKS')
    _last_mounts, mounts_after = mounts(e)
    if mounts_before != mounts_after:
        e.unknown('MOUNT_TABLE_CHANGED')
    lease_after = lease_observation(e, cfg)
    if lease_before != lease_after:
        e.unknown('PROTOCOL_OWNER_OR_STATE_CHANGED')
    ledger = e.summary()
    observed = ledger['categories']['possible_container_quota']['maxLogicalOrAllocatedBytes']
    out.update({'kind': 'ROOT210_READONLY_RESOURCE_EVIDENCE_V1',
        'atUtc': dt.datetime.now(dt.timezone.utc).isoformat(), 'uid': os.getuid(), 'gid': os.getgid(),
        'pid': os.getpid(), 'source': cfg['source'], 'runId': cfg['runId'],
        'suppliedDeploymentId': cfg['deploymentId'], 'suppliedImageDigest': cfg['imageDigest'],
        'identityScope': 'Deployment/image IDs supplied by Root; physical role bytes, process identities/namespaces and mounts observed here. No environment read.',
        'roleSha256': cfg['roleSha256'], 'protocolOwnerBefore': lease_before, 'protocolOwnerAfter': lease_after,
        'namespaces': own_ns, 'mountInfoSha256Before': mounts_before, 'mountInfoSha256After': mounts_after,
        'mounts': mount_rows, 'filesystemWalksBefore': first_walks, 'filesystemWalksAfter': second_walks,
        'processSnapshotBefore': first_processes, 'processSnapshotAfter': second_processes,
        'inodeAccounting': ledger, 'unlinkedOrPersistentReferences': e.references,
        'unlinkedOrPersistentReferenceCount': e.reference_count,
        'rootFilesystem': filesystem_stat('/'), 'tmpFilesystem': filesystem_stat('/tmp'),
        'dataFilesystem': filesystem_stat('/data'), 'liveFileMetadata': identity(os.lstat(LIVE)),
        'imageCensus': {'path': cfg['imageCensusPath'], 'sha256': cfg['imageCensusSha256'],
            'bytes': census_bytes, 'reviewSha256SuppliedByRoot': cfg['imageCensusReviewSha256'],
            'entries': len(census['entries']), 'uniqueImageInodes': len(unique),
            'wholeImageAndPostCensusArtifactUpperBytes': image_upper,
            'scope': 'Entire immutable image added again conservatively, covering image entries hidden beneath runtime mounts; independent final-image materialization provenance belongs to Root.'},
        'observedFileAndImageUpperBytes': observed + image_upper,
        'quota': {'bytes': 100000000000, 'evidenceSha256SuppliedByRoot': cfg['quotaEvidenceSha256'],
                  'scope': 'Separate entitlement, NEVER inferred from overlay statvfs.'},
        'memory': memory_metadata(e),
        'notCollectedOrCertified': ['DDL/main/journal/sort/subjournal peaks or future outputs/writers',
            'Allocator/COW/reservations/filesystem metadata overhead outside observed st_blocks',
            'Runtime-created mutable files hidden underneath mounts without an FD/map; fresh controlled writer history needs independent Root evidence',
            'Hidden provider cgroup ancestors and provider quota implementation',
            'Atomic global snapshot, future writer exclusion, restore validity or copy admission'],
        'scope': 'Two bounded complete attempted metadata walks/process censuses. Equality is observation evidence, not a guarantee about writes between/after observations.'})
    return out


def emit_image(e, args):
    root = literal(args.root)
    require(root != '/', 'image_emission_requires_independent_materialized_final_image_not_live_root')
    require(os.path.realpath(root) == root, 'image_root_alias')
    all_mounts, _ = mounts(e)
    children = [m['point'] for m in all_mounts if m['point'].startswith(root.rstrip('/') + '/')]
    require(not children, 'materialized_image_has_hidden_child_mounts')
    role_path = root + '/app/combined210-image-role.json'
    role = role_input(e, role_path, args.role_sha256)
    first, entries = fs_walk(e, root, set(), account=False, image=True)
    second, _ = fs_walk(e, root, set(), account=False)
    require(first == second, 'image_changed_during_full_census')
    return {'kind': 'FINAL_IMAGE_METADATA_CENSUS_V1', 'source': role['applicationSource'],
            'roleSha256': args.role_sha256, 'materializedRoot': first,
            'entries': entries, 'postCensusArtifactReserveBytes': MAX_JSON,
            'postCensusArtifactScope': 'Only the final census JSON itself may be added after this census, at most64MiB. Any other added/changed image file requires a new complete census.',
            'unknownCount': e.unknown_count,
            'provenanceScope': 'Observed materialized filesystem metadata. Root must independently bind this materialization to the final image layers/digest; not an image identity attestation.'}


def render(out, e, maximum):
    out.update(unknownCount=e.unknown_count, unknowns=e.unknowns,
               elapsedSeconds=round(time.monotonic() - e.started, 3),
               limits=e.limits, collectionState='UNKNOWNS_REQUIRE_RESOLUTION' if e.unknown_count else 'OBSERVATIONS_RECORDED_NOT_ADMISSION')
    raw = canonical(out) + b'\n'
    if len(raw) > maximum:
        raw = canonical({'kind': out.get('kind'), 'collectionState': 'OUTPUT_BOUND_EXCEEDED',
                         'unknownCount': e.unknown_count + 1, 'unknowns': [{'code': 'OUTPUT_BOUND_EXCEEDED'}],
                         'unemittedEvidenceSha256': sha(raw), 'unemittedBytes': len(raw)}) + b'\n'
        e.unknown_count += 1
    return raw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest='mode', required=True)
    run = modes.add_parser('collect')
    run.add_argument('--config', required=True)
    run.add_argument('--config-sha256', required=True)
    image = modes.add_parser('emit-image-census')
    image.add_argument('--root', required=True)
    image.add_argument('--role-sha256', required=True)
    args = parser.parse_args()
    # Limit only this metadata child, never a shared service/cgroup/host setting.
    e = Evidence()
    out = {'kind': 'ROOT210_RESOURCE_COLLECTION_INCOMPLETE'}
    signal.signal(signal.SIGALRM, lambda *_: (_ for _ in ()).throw(Stop('wall_time_limit')))
    signal.alarm(HARD['wallSeconds'])
    maximum = HARD['maxOutputBytes']
    try:
        soft, hard = resource.getrlimit(resource.RLIMIT_AS)
        cap = min([768 * 1024 * 1024] + [x for x in (soft, hard) if x >= 0])
        resource.setrlimit(resource.RLIMIT_AS, (cap, hard))
        if args.mode == 'collect':
            require(args.config.endswith('/resource-collector-config.json'), 'unexpected_config_filename')
            cfg, _ = read_json_input(e, args.config, args.config_sha256, 32768, private=True)
            e = Evidence(cfg.get('limits'))
            signal.alarm(e.limits['wallSeconds'])
            maximum = e.limits['maxOutputBytes']
            out = collect(e, cfg)
            out['configSha256'] = args.config_sha256
        else:
            e.limits['wallSeconds'] = HARD['wallSeconds']
            maximum = MAX_JSON
            out = emit_image(e, args)
    except (Stop, OSError, ValueError, KeyError, IndexError, MemoryError) as error:
        out = e.partial or out
        text = str(error).split(':', 1)
        e.unknown(type(error).__name__ + ':' + text[0], text[1] if len(text) > 1 else '', error)
        if isinstance(error, MemoryError):
            e.inodes.clear()
            out = {'kind': 'ROOT210_RESOURCE_COLLECTION_INCOMPLETE', 'reason': 'collector_memory_limit'}
    finally:
        signal.alarm(0)
    sys.stdout.buffer.write(render(out, e, maximum))
    return 2 if e.unknown_count else 0


if __name__ == '__main__':
    raise SystemExit(main())
