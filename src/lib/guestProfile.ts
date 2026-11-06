const NAME_KEY = 'birthday-party-guest-name'
const GUIDE_KEY = 'birthday-party-guide-seen'

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

export function hasSeenWelcomeGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeGuideSeen(): void {
  try {
    localStorage.setItem(GUIDE_KEY, '1')
  } catch {
    // private mode / quota
  }
}
