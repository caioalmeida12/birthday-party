import { MAX_PHOTO_BYTES, PHOTO_BUCKET } from './config'
import { requireSupabase } from './supabase'

export type Photo = {
  id: string
  storage_path: string
  submitted_by: string | null
  created_at: string
  publicUrl: string
}

export type PhotoInput = {
  file: File
  submittedBy?: string
}

function assertImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie apenas arquivos de imagem.')
  }
}

async function compressImage(file: File): Promise<Blob> {
  if (file.size <= MAX_PHOTO_BYTES && file.type !== 'image/heic') {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const maxSide = 1920
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.82)
  })

  if (!blob) return file
  if (blob.size > MAX_PHOTO_BYTES) {
    throw new Error('A imagem continua grande demais após compressão (máx. 5 MB).')
  }
  return blob
}

function extensionFor(blob: Blob, originalName: string): string {
  if (blob.type === 'image/jpeg') return 'jpg'
  if (blob.type === 'image/png') return 'png'
  if (blob.type === 'image/webp') return 'webp'
  const fromName = originalName.split('.').pop()?.toLowerCase()
  return fromName || 'jpg'
}

export async function listPhotos(): Promise<Photo[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('photos')
    .select('id, storage_path, submitted_by, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const { data: urlData } = client.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(row.storage_path)
    return { ...row, publicUrl: urlData.publicUrl }
  })
}

export async function uploadPhoto(input: PhotoInput): Promise<Photo> {
  assertImageFile(input.file)
  if (input.file.size > MAX_PHOTO_BYTES * 3) {
    throw new Error('Arquivo muito grande. Escolha uma imagem menor que ~15 MB.')
  }

  const blob = await compressImage(input.file)
  const ext = extensionFor(blob, input.file.name)
  const path = `${crypto.randomUUID()}.${ext}`
  const submittedBy = input.submittedBy?.trim() || null

  const client = requireSupabase()
  const { error: uploadError } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data, error } = await client
    .from('photos')
    .insert({
      storage_path: path,
      submitted_by: submittedBy,
    })
    .select('id, storage_path, submitted_by, created_at')
    .single()

  if (error) {
    await client.storage.from(PHOTO_BUCKET).remove([path])
    throw error
  }

  const { data: urlData } = client.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return { ...data, publicUrl: urlData.publicUrl }
}
