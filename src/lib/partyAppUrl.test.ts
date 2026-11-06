import { describe, expect, it } from 'vitest'
import { partyAppUrl } from './partyAppUrl'

describe('partyAppUrl', () => {
  it('monta URL absoluta a partir da origin e do base', () => {
    const url = partyAppUrl()
    expect(url).toMatch(/^https?:\/\//)
    expect(url.endsWith('/') || url.includes('birthday-party')).toBe(true)
  })
})
