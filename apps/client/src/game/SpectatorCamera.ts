export function getNextSpectatedPlayer(alivePlayerIds: readonly string[], currentId?: string) {
  if (!alivePlayerIds.length) return undefined;
  const currentIndex = currentId ? alivePlayerIds.indexOf(currentId) : -1;
  return alivePlayerIds[(currentIndex + 1) % alivePlayerIds.length];
}
