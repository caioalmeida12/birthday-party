import { Link } from 'react-router-dom'
import { copy } from '../lib/copy'
import { guestHopNeighbors, type GuestNavItem } from '../lib/guestPages'

type Props = {
  pathname: string
  ready: boolean
}

function HopLink({
  item,
  side,
}: {
  item: GuestNavItem
  side: 'prev' | 'next'
}) {
  const hint =
    side === 'prev' ? copy.navHopPrev(item.label) : copy.navHopNext(item.label)

  return (
    <Link
      to={item.path}
      className={`guest-hop guest-hop-${side}`}
      aria-label={hint}
      title={hint}
      onClick={(event) => {
        event.currentTarget.blur()
      }}
    >
      <i className={`fa-solid ${item.icon} guest-hop-icon`} aria-hidden="true" />
    </Link>
  )
}

/** Abas grudadas nas bordas — sensação de páginas ao lado, tipo livro. */
export function GuestSideHop({ pathname, ready }: Props) {
  const neighbors = guestHopNeighbors(pathname, ready)
  if (!neighbors) return null

  return (
    <nav className="guest-hop-rails" aria-label={copy.navHopLabel}>
      <HopLink item={neighbors.prev} side="prev" />
      <HopLink item={neighbors.next} side="next" />
    </nav>
  )
}
