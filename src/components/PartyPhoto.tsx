import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import {
  isHeicPhotoUrl,
  resolveDisplayablePhotoSrc,
} from '../lib/preparePhotoBlob'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
}

/**
 * <img> que converte HEIC legado pra JPEG no cliente.
 * Uploads novos já saem JPG; isso cobre os .heic antigos no storage.
 */
export function PartyPhoto({ src, alt = '', ...rest }: Props) {
  const needsConvert = isHeicPhotoUrl(src)
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!needsConvert) return

    let cancelled = false
    let objectUrl: string | null = null
    setConvertedSrc(null)

    void resolveDisplayablePhotoSrc(src)
      .then((next) => {
        if (cancelled) {
          if (next.startsWith('blob:')) URL.revokeObjectURL(next)
          return
        }
        objectUrl = next.startsWith('blob:') ? next : null
        setConvertedSrc(next)
      })
      .catch(() => {
        if (!cancelled) setConvertedSrc(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, needsConvert])

  const displaySrc = needsConvert ? convertedSrc : src
  if (!displaySrc) {
    return <span className={rest.className} aria-hidden style={{ display: 'block' }} />
  }

  return <img src={displaySrc} alt={alt} {...rest} />
}
