/**
 * Atributos do <input type="file"> do convidado.
 * Sem `capture`: no celular o SO oferece galeria e câmera.
 * Com `capture`, muitos browsers abrem só a câmera — galeria some.
 */
export function guestPhotoFileInputAttrs(): {
  type: 'file'
  accept: string
} {
  return {
    type: 'file',
    accept: 'image/*,image/heic,image/heif,.heic,.heif',
  }
}

export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  // iOS às vezes manda HEIC da galeria sem MIME.
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}
