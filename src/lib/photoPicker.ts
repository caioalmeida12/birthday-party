/**
 * Atributos do <input type="file"> do convidado.
 * Sem `capture`: no celular o SO oferece galeria e câmera.
 * Com `capture`, muitos browsers abrem só a câmera — galeria some.
 */
export function guestPhotoFileInputAttrs(options?: { multiple?: boolean }): {
  type: 'file'
  accept: string
  multiple?: true
} {
  return {
    type: 'file',
    accept: 'image/*,image/heic,image/heif,.heic,.heif',
    ...(options?.multiple ? { multiple: true as const } : {}),
  }
}

export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  // iOS às vezes manda HEIC da galeria sem MIME.
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}

/** Arquivos de imagem escolhidos no picker (um ou vários). */
export function filesFromPhotoPicker(list: FileList | null | undefined): File[] {
  if (!list || list.length === 0) return []
  return [...list].filter(isLikelyImageFile)
}