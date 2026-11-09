export type GuestNavItem = {
  path: string
  label: string
  emoji: string
  requiresReady?: boolean
}

/** Ordem do anel horizontal e da navbar: música → foto → conversa. */
export const GUEST_NAV: GuestNavItem[] = [
  { path: '/musicas', label: 'Músicas', emoji: '🎵' },
  { path: '/fotos', label: 'Fotos', emoji: '📷' },
  { path: '/conversa', label: 'Conversa', emoji: '💬', requiresReady: true },
]

export function guestNavItems(ready: boolean): GuestNavItem[] {
  return GUEST_NAV.filter((item) => !item.requiresReady || ready)
}

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.endsWith(path)
}

export function guestHopNeighbors(
  pathname: string,
  ready: boolean,
): { prev: GuestNavItem; next: GuestNavItem } | null {
  const ring = guestNavItems(ready)
  const index = ring.findIndex((item) => matchesPath(pathname, item.path))
  if (index < 0 || ring.length < 2) return null
  return {
    prev: ring[(index - 1 + ring.length) % ring.length]!,
    next: ring[(index + 1) % ring.length]!,
  }
}

export function isGuestHopPath(pathname: string): boolean {
  return GUEST_NAV.some((item) => matchesPath(pathname, item.path))
}
