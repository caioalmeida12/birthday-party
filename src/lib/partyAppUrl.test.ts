import { describe, expect, it } from 'vitest'
import { partyAppUrl } from './partyAppUrl'

describe('partyAppUrl', () => {
  it('monta URL absoluta da raiz', () => {
    const url = partyAppUrl()
    expect(url).toMatch(/^https?:\/\//)
    expect(url.endsWith('/')).toBe(true)
  })

  it('encaixa path relativo sem perder o base', () => {
    const camera = partyAppUrl('camera')
    const music = partyAppUrl('musicas')
    expect(camera).toMatch(/camera\/?$/)
    expect(music).toMatch(/musicas\/?$/)
    expect(camera).toContain(new URL(partyAppUrl()).pathname.replace(/\/$/, ''))
  })
})
