import { describe, expect, it } from 'vitest'
import { classifySongInput, looksLikeUrlAttempt } from './songSuggestion'

describe('classifySongInput', () => {
  it('trata link do YouTube como música pronta', () => {
    expect(classifySongInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      kind: 'music-url',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
  })

  it('aceita youtu.be sem protocolo', () => {
    const result = classifySongInput('youtu.be/dQw4w9WgXcQ')
    expect(result.kind).toBe('music-url')
    if (result.kind === 'music-url') {
      expect(result.url).toContain('youtu.be/dQw4w9WgXcQ')
    }
  })

  it('trata link do Spotify como música pronta', () => {
    const result = classifySongInput(
      'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl?si=abc',
    )
    expect(result.kind).toBe('music-url')
    if (result.kind === 'music-url') {
      expect(result.url).toBe('https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl')
    }
  })

  it('trata nome de música como busca', () => {
    expect(classifySongInput('Bohemian Rhapsody Queen')).toEqual({
      kind: 'query',
      query: 'Bohemian Rhapsody Queen',
    })
  })

  it('rejeita link de site que não é Spotify/YouTube', () => {
    expect(classifySongInput('https://soundcloud.com/artist/track')).toEqual({
      kind: 'bad-url',
    })
  })

  it('não confunde nome com “www” no meio do texto', () => {
    expect(classifySongInput('festa www animada')).toEqual({
      kind: 'query',
      query: 'festa www animada',
    })
  })
})

describe('looksLikeUrlAttempt', () => {
  it('detecta http e hosts conhecidos', () => {
    expect(looksLikeUrlAttempt('https://example.com/x')).toBe(true)
    expect(looksLikeUrlAttempt('www.google.com')).toBe(true)
    expect(looksLikeUrlAttempt('open.spotify.com/track/x')).toBe(true)
  })

  it('não marca nome comum como link', () => {
    expect(looksLikeUrlAttempt('Mas que nada')).toBe(false)
  })
})
