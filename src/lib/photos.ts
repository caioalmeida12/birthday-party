import { MAX_PHOTO_BYTES, PHOTO_BUCKET } from './config'
import { requireSupabase } from './supabase'

export type Photo = {
  id: string
  storage_path: string
  submitted_by: string | null
  created_at: string
  approved: boolean
  publicUrl: string
}

export type PhotoInput = {
  file: File
  submittedBy?: string
}

type PhotoRow = {
  id: string
  storage_path: string
  submitted_by: string | null
  created_at: string
  approved?: boolean | null
}

const PHOTO_SELECT = 'id, storage_path, submitted_by, created_at, approved'

function mapPhoto(
  row: PhotoRow,
  publicUrl: string,
): Photo {
  return {
    id: row.id,
    storage_path: row.storage_path,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    approved: row.approved !== false,
    publicUrl,
  }
}

function withPublicUrl(row: PhotoRow): Photo {
  const client = requireSupabase()
  const { data: urlData } = client.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path)
  return mapPhoto(row, urlData.publicUrl)
}

function migrationHint(error: { code?: string; message: string }): Error | null {
  if (error.code === 'PGRST204' || /approved/.test(error.message)) {
    return new Error(
      'Falta rodar a migration no Supabase (supabase/migration-photo-moderation.sql).',
    )
  }
  return null
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

/** Galeria pública: só aprovadas. */
export async function listPhotos(): Promise<Photo[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('photos')
    .select(PHOTO_SELECT)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return ((data as PhotoRow[] | null) ?? []).map(withPublicUrl)
}

/** Fila do anfitrião: pendentes de revisão. */
export async function listPendingPhotos(): Promise<Photo[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('photos')
    .select(PHOTO_SELECT)
    .eq('approved', false)
    .order('created_at', { ascending: true })

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return ((data as PhotoRow[] | null) ?? []).map(withPublicUrl)
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
      approved: false,
    })
    .select(PHOTO_SELECT)
    .single()

  if (error) {
    await client.storage.from(PHOTO_BUCKET).remove([path])
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return withPublicUrl(data as PhotoRow)
}

export async function approvePhoto(photoId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('photos').update({ approved: true }).eq('id', photoId)
  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }
}

export async function rejectPhoto(photo: Photo): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('photos').delete().eq('id', photo.id)
  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }
  await client.storage.from(PHOTO_BUCKET).remove([photo.storage_path])
}
