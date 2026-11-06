import { useState } from 'react'

const BASE = import.meta.env.BASE_URL

/** Coloque `public/invite.jpg` (ou .png/.webp) pra substituir o SVG padrão. */
const SOURCES = [`${BASE}invite.jpg`, `${BASE}invite.png`, `${BASE}invite.webp`, `${BASE}invite.svg`]

type Props = {
  className?: string
  alt?: string
}

export function InviteArt({ className = 'invite-art', alt = 'Convite' }: Props) {
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
