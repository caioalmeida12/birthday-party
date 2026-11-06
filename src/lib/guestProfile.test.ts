import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getRememberedGuestName,
  hasSeenWelcomeGuide,
  markWelcomeGuideSeen,
  rememberGuestName,
} from './guestProfile'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
    },
  })
})

afterEach(() => {
  store.clear()
})

describe('guestProfile', () => {
  it('lembra o nome do convidado', () => {
    rememberGuestName('  Nádia  ')
    expect(getRememberedGuestName()).toBe('Nádia')
  })

  it('marca o guide-in como visto só depois de concluir', () => {
    expect(hasSeenWelcomeGuide()).toBe(false)
    markWelcomeGuideSeen()
    expect(hasSeenWelcomeGuide()).toBe(true)
  })
})
