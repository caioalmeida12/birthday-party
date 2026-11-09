export type PhotoStageSpeed = 'slow' | 'normal' | 'fast'

export const PHOTO_STAGE_SPEED_MS: Record<PhotoStageSpeed, number> = {
  slow: 12_000,
  normal: 8_000,
  fast: 4_000,
}

export const PHOTO_STAGE_SPEED_ORDER: PhotoStageSpeed[] = ['slow', 'normal', 'fast']

export function wrapPhotoIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

export function stepPhotoIndex(index: number, length: number, delta: number): number {
  if (length <= 0) return 0
  return wrapPhotoIndex(index + delta, length)
}

export type PhotoStageThumbRole = 'past' | 'current' | 'next'

export type PhotoStageThumb<T> = {
  item: T
  index: number
  role: PhotoStageThumbRole
}

/**
 * Faixa sob a foto atual: últimas + atual + próximas (anel circular).
 */
export function photoStageWindow<T>(
  items: T[],
  currentIndex: number,
  behind = 3,
  ahead = 3,
): Array<PhotoStageThumb<T>> {
  const length = items.length
  if (length === 0) return []

  const index = wrapPhotoIndex(currentIndex, length)
  const result: Array<PhotoStageThumb<T>> = []

  for (let offset = -behind; offset <= ahead; offset += 1) {
    const i = wrapPhotoIndex(index + offset, length)
    result.push({
      item: items[i],
      index: i,
      role: offset < 0 ? 'past' : offset > 0 ? 'next' : 'current',
    })
  }

  return result
}

export function nextPhotoStageSpeed(current: PhotoStageSpeed): PhotoStageSpeed {
  const at = PHOTO_STAGE_SPEED_ORDER.indexOf(current)
  return PHOTO_STAGE_SPEED_ORDER[(at + 1) % PHOTO_STAGE_SPEED_ORDER.length]
}
