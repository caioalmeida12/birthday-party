const STORAGE_KEY = 'birthday-party-voter-key'

function createVoterKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `voter-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getVoterKey(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = createVoterKey()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return createVoterKey()
  }
}
