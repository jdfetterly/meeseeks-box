export function normalizeAgentContextId(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  switch (normalized) {
    case 'ops':
      return 'mini-ops'
    case 'personal':
      return 'jd-personal'
    case 'default':
      return 'main'
    default:
      return normalized
  }
}
