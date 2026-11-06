export type PhotoKind = 'decor' | 'live'

export function parsePhotoKind(value: string | null | undefined): PhotoKind {
  return value === 'live' ? 'live' : 'decor'
}

/** Galeria/mosaico de decoração: só kind decor. */
export function isDecorPhoto(kind: PhotoKind): boolean {
  return kind === 'decor'
}

export function isLivePhoto(kind: PhotoKind): boolean {
  return kind === 'live'
}
