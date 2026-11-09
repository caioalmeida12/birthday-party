export type OrderableSong = {
  id: string
  position: number
  score: number
  created_at: string
  skipped: boolean
}

/** Fila da TV / playhead: posição manual do anfitrião manda. */
export function sortSongsForQueue<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs]
    .filter((song) => !song.skipped)
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position
      if (b.score !== a.score) return b.score - a.score
      return a.created_at.localeCompare(b.created_at)
    })
}

/**
 * Fila que o convidado vê em /musicas: mais gostei (score) sobe de verdade.
 * Empate → posição do anfitrião → quem entrou antes.
 */
export function sortSongsForBoard<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1
    if (b.score !== a.score) return b.score - a.score
    if (a.position !== b.position) return a.position - b.position
    return a.created_at.localeCompare(b.created_at)
  })
}

export function sortSongsForModeration<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position
    return a.created_at.localeCompare(b.created_at)
  })
}
