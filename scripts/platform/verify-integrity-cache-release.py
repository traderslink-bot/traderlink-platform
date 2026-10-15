import ctypes
import hashlib
import mmap
import os
from pathlib import Path
import subprocess
import tempfile

HELPER = '/proof/traderlink-integrity-cache-release'
print({'proof': 'starting', 'uid': os.getuid()}, flush=True)
libc = ctypes.CDLL(None, use_errno=True)
libc.mincore.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p]
libc.mincore.restype = ctypes.c_int


def resident_bytes(path):
    size = path.stat().st_size
    page_size = os.sysconf('SC_PAGE_SIZE')
    with path.open('rb') as source:
        region = mmap.mmap(source.fileno(), size, access=mmap.ACCESS_COPY)
        anchor = ctypes.c_char.from_buffer(region)
        vector = (ctypes.c_ubyte * ((size + page_size - 1) // page_size))()
        assert libc.mincore(ctypes.addressof(anchor), size, vector) == 0
        result = sum(1 for item in vector if item & 1) * page_size
        del anchor
        region.close()
    return result


def run(path, device=None, inode=None):
    details = path.stat()
    result = subprocess.run([HELPER, str(path), str(details.st_dev if device is None else device),
                           str(details.st_ino if inode is None else inode)], timeout=4,
                          check=False).returncode
    print({'helper_exit': result}, flush=True)
    return result


with tempfile.TemporaryDirectory(prefix='traderlink-cache-proof-') as directory:
    root = Path(directory)
    path = root / 'disposable.sqlite'
    block = bytes(range(256)) * 4096
    with path.open('wb') as target:
        for _ in range(16):
            target.write(block)
        target.flush()
        os.fsync(target.fileno())  # Disposable fixture only; helper never syncs a database.
    before = hashlib.sha256(path.read_bytes()).hexdigest()
    path.chmod(0o400)
    identity = path.stat()
    assert run(path, inode=identity.st_ino + 1) == 67
    assert run(path, device=identity.st_dev + 1) == 67
    link = root / 'symlink.sqlite'
    link.symlink_to(path)
    assert run(link) == 66
    assert run(root) == 67
    assert subprocess.run([HELPER, 'relative.sqlite', '1', '1'], timeout=4).returncode == 64
    assert subprocess.run([HELPER, str(path), '-1', '1'], timeout=4).returncode == 64
    resident_before = resident_bytes(path)
    assert resident_before >= path.stat().st_size
    assert run(path) == 0
    resident_after = resident_bytes(path)
    assert resident_after < resident_before, (resident_before, resident_after)
    after = hashlib.sha256(path.read_bytes()).hexdigest()
    final = path.stat()
    assert before == after
    assert (identity.st_dev, identity.st_ino, identity.st_size) == (final.st_dev, final.st_ino, final.st_size)
    assert not (root / 'disposable.sqlite-wal').exists()
    assert not (root / 'disposable.sqlite-shm').exists()
    print({'proof': 'PASS', 'uid': os.getuid(), 'bytes': final.st_size,
           'resident_before': resident_before, 'resident_after': resident_after,
           'content_unchanged': True, 'identity_unchanged': True,
           'unsafe_targets_rejected': True}, flush=True)
