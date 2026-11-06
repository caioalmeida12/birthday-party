import { useState } from 'react'

const BASE = import.meta.env.BASE_URL

/** Preferência: `public/invite.jpg` (ou .png/.webp). Sem arquivo, não mostra nada. */
const SOURCES = [`${BASE}invite.jpg`, `${BASE}invite.jpeg`, `${BASE}invite.png`, `${BASE}invite.webp`]

type Props = {
  className?: string
  alt?: string
}

export function InviteArt({ className = 'invite-art', alt = '' }: Props) {
  const [index, setIndex] = useState(0)
  const src = SOURCES[index]

  if (!src) return null

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => {
        setIndex((current) => current + 1)
      }}
    />
  )
}
