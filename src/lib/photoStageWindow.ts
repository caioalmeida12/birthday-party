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

/** Fisher–Yates; opcionalmente deixa `currentId` na frente pra o slide não pular. */
export function shufflePhotoOrder<T extends { id: string }>(
  items: T[],
  currentId: string | null = null,
  random: () => number = Math.random,
): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1))
    const temp = shuffled[index]
    shuffled[index] = shuffled[swapWith]
    shuffled[swapWith] = temp
  }

  if (!currentId) return shuffled
  const currentAt = shuffled.findIndex((item) => item.id === currentId)
  if (currentAt <= 0) return shuffled
  const [current] = shuffled.splice(currentAt, 1)
  return [current, ...shuffled]
}

/**
 * Com shuffle ligado, preserva a ordem atual e só anexa fotos novas no fim.
 * Com shuffle off, devolve a lista cronológica do servidor.
 */
export function syncPhotoStageOrder<T extends { id: string }>(
  previousOrder: T[],
  nextItems: T[],
  shuffled: boolean,
): T[] {
  if (!shuffled) return nextItems

  const byId = new Map(nextItems.map((item) => [item.id, item]))
  const kept: T[] = []
  for (const item of previousOrder) {
    const fresh = byId.get(item.id)
    if (fresh) kept.push(fresh)
  }
  const keptIds = new Set(kept.map((item) => item.id))
  const added = nextItems.filter((item) => !keptIds.has(item.id))
  return [...kept, ...added]
}
