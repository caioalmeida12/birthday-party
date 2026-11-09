export type OrderableSong = {
  id: string
  position: number
  score: number
  created_at: string
  skipped: boolean
}

/**
 * Fila da TV / playhead: mesma ordem do board do convidado (score manda).
 * Empate → posição do anfitrião → quem entrou antes. Skipped fora.
 */
export function sortSongsForQueue<T extends OrderableSong>(songs: T[]): T[] {
  return sortSongsForBoard(songs).filter((song) => !song.skipped)
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
