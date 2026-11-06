export type OrderableSong = {
  id: string
  position: number
  score: number
  created_at: string
  skipped: boolean
}

export function sortSongsForQueue<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs]
    .filter((song) => !song.skipped)
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position
      if (b.score !== a.score) return b.score - a.score
      return a.created_at.localeCompare(b.created_at)
    })
}

export function sortSongsForBoard<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1
    if (a.position !== b.position) return a.position - b.position
    if (b.score !== a.score) return b.score - a.score
    return a.created_at.localeCompare(b.created_at)
  })
}

export function sortSongsForModeration<T extends OrderableSong>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position
    return a.created_at.localeCompare(b.created_at)
  })
}
