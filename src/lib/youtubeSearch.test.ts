import { describe, expect, it } from 'vitest'
import {
  extractIdFromPipedUrl,
  mapPipedItemsToCandidates,
  youtubeWatchUrl,
} from './youtubeSearch'

describe('youtubeSearch helpers', () => {
  it('monta url watch a partir do id', () => {
    expect(youtubeWatchUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('extrai id de paths do Piped', () => {
    expect(extractIdFromPipedUrl('/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractIdFromPipedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
  })

  it('mapeia os primeiros vídeos e ignora o que não é stream', () => {
    const candidates = mapPipedItemsToCandidates(
      [
        { type: 'playlist', url: '/watch?v=playlist11', title: 'Lista' },
        {
          type: 'stream',
          url: '/watch?v=dQw4w9WgXcQ',
          title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
          uploaderName: 'RickAstleyVEVO',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        },
        {
          type: 'stream',
          url: '/watch?v=abcABCabcAB',
          title: 'Outra',
          uploaderName: 'Canal',
        },
        {
          type: 'stream',
          url: '/watch?v=dQw4w9WgXcQ',
          title: 'Duplicata',
        },
      ],
      3,
    )

    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      artist: 'Rick Astley',
      title: 'Never Gonna Give You Up',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    })
    expect(candidates[1].videoId).toBe('abcABCabcAB')
  })

  it('respeita o limite pedido', () => {
    const items = [
      { type: 'stream', url: '/watch?v=aaaaaaaaaaa', title: 'A' },
      { type: 'stream', url: '/watch?v=bbbbbbbbbbb', title: 'B' },
      { type: 'stream', url: '/watch?v=ccccccccccc', title: 'C' },
    ]
    expect(mapPipedItemsToCandidates(items, 1)).toHaveLength(1)
  })
})
