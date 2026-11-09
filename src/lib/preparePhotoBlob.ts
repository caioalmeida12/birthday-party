import { MAX_PHOTO_BYTES } from './config'
import { isLikelyImageFile } from './photoPicker'

export function isHeicLikeFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name)
  )
}

export function isHeicPhotoUrl(url: string): boolean {
  try {
    const path = new URL(url, 'https://local.invalid').pathname
    return /\.hei[cf]$/i.test(path)
  } catch {
    return /\.hei[cf](\?|#|$)/i.test(url)
  }
}

export type HeicToJpeg = (blob: Blob) => Promise<Blob>

async function defaultHeicToJpeg(blob: Blob): Promise<Blob> {
  const { heicTo } = await import('heic-to')
  const converted = await heicTo({
    blob,
    type: 'image/jpeg',
    quality: 0.82,
  })
  const jpeg = Array.isArray(converted) ? converted[0] : converted
  if (!(jpeg instanceof Blob)) {
    throw new Error('Conversão HEIC não retornou imagem.')
  }
  return jpeg.type ? jpeg : new Blob([jpeg], { type: 'image/jpeg' })
}

async function bitmapToJpeg(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const maxSide = 1920
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas indisponível pra redimensionar a foto.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.82)
  })
  if (!blob) throw new Error('Não deu pra gerar JPEG da foto.')
  return blob
}

function assertNotHeicBlob(blob: Blob, context: string): void {
  if (blob.type === 'image/heic' || blob.type === 'image/heif') {
    throw new Error(`${context}: ainda saiu HEIC.`)
  }
}

/**
 * Prepara blob pra storage/exibição: HEIC vira JPEG (obrigatório).
 * Nunca devolve HEIC — senão Chrome/TV não renderizam.
 */
export async function preparePhotoBlob(
  file: File,
  options?: { heicToJpeg?: HeicToJpeg; maxBytes?: number },
): Promise<Blob> {
  if (!isLikelyImageFile(file)) {
    throw new Error('Envie apenas arquivos de imagem.')
  }

  const maxBytes = options?.maxBytes ?? MAX_PHOTO_BYTES
  const heicToJpeg = options?.heicToJpeg ?? defaultHeicToJpeg

  if (file.size > maxBytes * 3) {
    throw new Error('Arquivo muito grande. Escolha uma imagem menor que ~15 MB.')
  }

  let working: Blob = file

  if (isHeicLikeFile(file)) {
    try {
      working = await heicToJpeg(file)
    } catch {
      throw new Error(
        'Não deu pra converter essa foto HEIC. No iPhone: Ajustes → Câmera → Formatos → Mais Compatível.',
      )
    }
    assertNotHeicBlob(working, 'Conversão HEIC')
  }

  const alreadyWebFriendly =
    working.type.startsWith('image/') &&
    working.type !== 'image/heic' &&
    working.type !== 'image/heif'

  if (alreadyWebFriendly && working.size <= maxBytes) {
    return working
  }

  try {
    const jpeg = await bitmapToJpeg(working)
    assertNotHeicBlob(jpeg, 'Redimensionamento')
    if (jpeg.size > maxBytes) {
      throw new Error('A imagem continua grande demais após compressão (máx. 5 MB).')
    }
    return jpeg
  } catch (err) {
    if (isHeicLikeFile(file)) {
      throw err instanceof Error
        ? err
        : new Error('Não deu pra converter essa foto HEIC.')
    }
    if (alreadyWebFriendly && working.size <= maxBytes) {
      return working
    }
    throw err instanceof Error
      ? err
      : new Error('Não deu pra ler essa foto da galeria.')
  }
}

/** Baixa HEIC já publicado e devolve object URL JPEG pro <img>. */
export async function resolveDisplayablePhotoSrc(
  url: string,
  options?: { heicToJpeg?: HeicToJpeg },
): Promise<string> {
  if (!isHeicPhotoUrl(url)) return url

  const response = await fetch(url)
  if (!response.ok) throw new Error('Não deu pra baixar a foto HEIC.')
  const blob = await response.blob()
  const heicToJpeg = options?.heicToJpeg ?? defaultHeicToJpeg
  const jpeg = await heicToJpeg(blob)
  assertNotHeicBlob(jpeg, 'Exibição HEIC')
  return URL.createObjectURL(jpeg.type ? jpeg : new Blob([jpeg], { type: 'image/jpeg' }))
}

export function extensionForPhotoBlob(blob: Blob, originalName: string): string {
  if (blob.type === 'image/jpeg') return 'jpg'
  if (blob.type === 'image/png') return 'png'
  if (blob.type === 'image/webp') return 'webp'
  if (blob.type === 'image/heic' || blob.type === 'image/heif') return 'jpg'
  const fromName = originalName.split('.').pop()?.toLowerCase()
  if (fromName === 'heic' || fromName === 'heif') return 'jpg'
  return fromName || 'jpg'
}
