import { describe, expect, it } from 'vitest'
import {
  extractIdFromPipedUrl,
  mapPipedItemsToCandidates,
  scoreSearchCandidate,
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

  it('prioriza match oficial e rebaixa karaoke', () => {
    const candidates = mapPipedItemsToCandidates(
      [
        {
          type: 'stream',
          url: '/watch?v=karaoke1111',
          title: 'Lembrança Boa Karaoke',
          uploaderName: 'KaraokeChannel',
        },
        {
          type: 'stream',
          url: '/watch?v=official111',
          title: 'Pedro e Benicio - Lembrança Boa (Official Audio)',
          uploaderName: 'PedroBenicioVEVO',
        },
        {
          type: 'stream',
          url: '/watch?v=random22222',
          title: 'Tarcísio do Acordeon (Tarcisiologia)',
          uploaderName: 'CanalAleatorio',
        },
      ],
      3,
      'Lembrança Boa Pedro e Benicio',
    )

    const ids = candidates.map((item) => item.videoId)
    expect(ids[0]).toBe('official111')
    expect(ids.indexOf('karaoke1111')).toBeLessThan(ids.indexOf('random22222'))
  })

  it('pontua query contra título', () => {
    expect(
      scoreSearchCandidate('never gonna give you up', 'Rick Astley - Never Gonna Give You Up', 'VEVO'),
    ).toBeGreaterThan(
      scoreSearchCandidate('never gonna give you up', 'Random karaoke cover', 'Karaoke'),
    )
  })

  it('respeita o limite pedido', () => {
    const items = [
      { type: 'stream', url: '/watch?v=aaaaaaaaaaa', title: 'A' },
      { type: 'stream', url: '/watch?v=bbbbbbbbbbb', title: 'B' },
      { type: 'stream', url: '/watch?v=ccccccccccc', title: 'C' },
    ]
    expect(mapPipedItemsToCandidates(items, 1, 'A')).toHaveLength(1)
  })
})
