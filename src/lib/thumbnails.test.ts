import { describe, expect, it } from 'vitest'
import { directSongThumbUrl, youtubeThumbUrl } from './thumbnails'

describe('thumbnails', () => {
  it('monta url do youtube', () => {
    expect(youtubeThumbUrl('dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })

  it('extrai thumb de link youtube e ignora spotify', () => {
    expect(
      directSongThumbUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toContain('dQw4w9WgXcQ')
    expect(directSongThumbUrl('https://open.spotify.com/track/abc')).toBeNull()
  })
})
