import { useState } from 'react'

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

export function useGuestNickname(): [string, (value: string) => void, () => void] {
  const [value, setValue] = useState(() => getRememberedGuestName())

  function persist() {
    rememberGuestName(value)
  }

  return [value, setValue, persist]
}
