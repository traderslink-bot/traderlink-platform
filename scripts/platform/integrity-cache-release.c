#define _GNU_SOURCE
#define _FILE_OFFSET_BITS 64
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <signal.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/prctl.h>
#include <sys/stat.h>
#include <unistd.h>

/* No writes, truncation, checkpoints, sync, WAL access or global cache control.
 * DONTNEED is inode-wide advice, NOT isolation from other application readers.
 * Dirty/unreclaimable pages may remain resident; success is not a RAM promise.
 */
static int identity_number(const char *text, uintmax_t *value) {
  if (!text || !*text) return 0;
  for (const char *p = text; *p; ++p) if (*p < '0' || *p > '9') return 0;
  errno = 0;
  char *end = NULL;
  *value = strtoumax(text, &end, 10);
  return errno == 0 && end && *end == '\0';
}

int main(int argc, char **argv) {
  uintmax_t device, inode;
  if (argc != 4 || argv[1][0] != '/' ||
      !identity_number(argv[2], &device) || !identity_number(argv[3], &inode)) return 64;
  const pid_t parent = getppid();
  /* PID 1 is a valid application parent inside a container. */
  if (parent <= 0 || prctl(PR_SET_PDEATHSIG, SIGKILL) != 0 || getppid() != parent) return 65;
  alarm(2);
  const int fd = open(argv[1], O_RDONLY | O_CLOEXEC | O_NOFOLLOW | O_NONBLOCK);
  if (fd < 0) return 66;
  struct stat details;
  if (fstat(fd, &details) != 0 || !S_ISREG(details.st_mode) ||
      (uintmax_t)details.st_dev != device || (uintmax_t)details.st_ino != inode) {
    close(fd);
    return 67;
  }
  const long page_size = sysconf(_SC_PAGESIZE);
  if (page_size <= 0 || details.st_size < 0) { close(fd); return 68; }
  /* Avoid the partial tail page and leave all dirty pages to normal SQLite I/O. */
  const off_t length = details.st_size - details.st_size % page_size;
  const int advised = length > 0 ? posix_fadvise(fd, 0, length, POSIX_FADV_DONTNEED) : 0;
  close(fd);
  return advised == 0 ? 0 : 69;
}
