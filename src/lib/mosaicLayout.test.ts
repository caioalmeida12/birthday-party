import { describe, expect, it } from 'vitest'
import { buildMasonryColumns, type MosaicItem } from './mosaicLayout'

const items: MosaicItem[] = [
  { id: 'a', src: 'a.jpg', aspect: 1 },
  { id: 'b', src: 'b.jpg', aspect: 1.5 },
  { id: 'c', src: 'c.jpg', aspect: 0.7 },
]

describe('buildMasonryColumns', () => {
  it('preenche a altura alvo com colunas suficientes pra largura', () => {
    const columns = buildMasonryColumns(items, {
      columnWidth: 120,
      targetHeight: 600,
      targetWidth: 400,
      gap: 4,
    })

    expect(columns.length).toBeGreaterThanOrEqual(4)
    for (const column of columns) {
      expect(column.height).toBeGreaterThanOrEqual(600)
      expect(column.tiles.length).toBeGreaterThan(0)
    }
  })

  it('respeita aspectos distintos nas alturas', () => {
    const columns = buildMasonryColumns(
      [{ id: 'wide', src: 'w.jpg', aspect: 2 }],
      { columnWidth: 100, targetHeight: 200, targetWidth: 100, gap: 0 },
    )
    expect(columns[0].tiles[0].height).toBe(50)
  })
})
