export type MosaicItem = {
  id: string
  src: string
  aspect: number
}

export type MosaicTile = MosaicItem & {
  width: number
  height: number
}

export type MosaicColumn = {
  tiles: MosaicTile[]
  height: number
}

const GAP = 4

/**
 * Empacota fotos em colunas verticais (estilo Google Fotos / masonry),
 * respeitando o aspecto. Preenche até cobrir targetWidth × targetHeight.
 */
export function buildMasonryColumns(
  items: MosaicItem[],
  options: {
    columnWidth: number
    targetHeight: number
    targetWidth: number
    gap?: number
  },
): MosaicColumn[] {
  if (items.length === 0) return []

  const gap = options.gap ?? GAP
  const { columnWidth, targetHeight, targetWidth } = options
  const minColumns = Math.max(4, Math.ceil(targetWidth / (columnWidth + gap)) + 2)

  const columns: MosaicColumn[] = Array.from({ length: minColumns }, () => ({
    tiles: [],
    height: 0,
  }))

  let cursor = 0
  let guard = 0
  const maxTiles = minColumns * 40

  while (guard < maxTiles) {
    const shortest = columns.reduce((best, col, index) =>
      col.height < columns[best].height ? index : best,
    0)
    const column = columns[shortest]
    if (column.height >= targetHeight && columns.every((col) => col.height >= targetHeight)) {
      break
    }

    const item = items[cursor % items.length]
    const height = Math.max(48, Math.round(columnWidth / Math.max(item.aspect, 0.35)))
    column.tiles.push({
      ...item,
      id: `${item.id}-${guard}`,
      width: columnWidth,
      height,
    })
    column.height += height + (column.tiles.length > 1 ? gap : 0)
    cursor += 1
    guard += 1
  }

  return columns
}
