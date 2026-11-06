const NAME_KEY = 'birthday-party-guest-name'

export function getRememberedGuestName(): string {
  try {
    return localStorage.getItem(NAME_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function rememberGuestName(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(NAME_KEY, trimmed)
  } catch {
    // private mode / quota
  }
}
