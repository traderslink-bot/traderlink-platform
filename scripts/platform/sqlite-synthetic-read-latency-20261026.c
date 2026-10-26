#define _GNU_SOURCE
#define _LARGEFILE64_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

/* Local synthetic fixture only: simulate pager-read latency, NOT Railway timing.
 * Bind to the exact test inode; other Node/source/system files are untouched. */
static unsigned long reads;
ssize_t pread64(int fd, void *buffer, size_t count, off64_t offset) {
  static ssize_t (*next)(int, void *, size_t, off64_t);
  if (!next) *(void **)(&next) = dlsym(RTLD_NEXT, "pread64");
  struct stat s;
  const char *dev = getenv("TRADERLINK_SQLITE_BENCH_DEVICE");
  const char *ino = getenv("TRADERLINK_SQLITE_BENCH_INODE");
  if (dev && ino && fstat(fd, &s) == 0 && s.st_dev == strtoull(dev, NULL, 10) && s.st_ino == strtoull(ino, NULL, 10)) {
    struct timespec wait = { .tv_sec = 0, .tv_nsec = 50000 };
    while (nanosleep(&wait, &wait) == -1 && errno == EINTR) {}
    reads++;
  }
  return next(fd, buffer, count, offset);
}
__attribute__((destructor)) static void report(void) {
  fprintf(stderr, "{\"simulatedFixturePagerReads\":%lu}\n", reads);
}
