import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import { partyAppUrl } from '../lib/partyAppUrl'

type Props = {
  /** Tamanho do QR em px (lado). */
  size?: number
  className?: string
  showLabel?: boolean
}

export function GuestQr({ size = 148, className = '', showLabel = true }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [url] = useState(() => partyAppUrl())

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(url, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0c1511', light: '#f7e7c2' },
    }).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl)
    })
    return () => {
      cancelled = true
    }
  }, [url, size])

  return (
    <figure className={`guest-qr ${className}`.trim()}>
      {src ? (
        <img src={src} width={size} height={size} alt={copy.hostQrAlt} />
      ) : (
        <div className="guest-qr-placeholder" style={{ width: size, height: size }} />
      )}
      {showLabel ? (
        <figcaption>
          <strong>{copy.hostQrTitle}</strong>
          <span>{copy.hostQrHint}</span>
        </figcaption>
      ) : null}
    </figure>
  )
}
