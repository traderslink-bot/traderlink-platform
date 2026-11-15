/** Keep coaching operations separate from the student enrollment experience. */
export function isCoachingStaff(capabilities: readonly string[]): boolean {
  return capabilities.some(capability => [
    "community.coaching.offer",
    "community.coaching.students",
  ].includes(capability));
}
