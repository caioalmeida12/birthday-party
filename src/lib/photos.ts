import { MAX_PHOTO_BYTES, PHOTO_BUCKET } from './config'
import { parsePhotoKind, type PhotoKind } from './photoKind'
import { requireSupabase } from './supabase'

export type Photo = {
  id: string
  storage_path: string
  submitted_by: string | null
  created_at: string
  approved: boolean
  kind: PhotoKind
  publicUrl: string
}

export type PhotoInput = {
  file: File
  submittedBy?: string
  kind?: PhotoKind
}

type PhotoRow = {
  id: string
  storage_path: string
  submitted_by: string | null
  created_at: string
  approved?: boolean | null
  kind?: string | null
}

const PHOTO_SELECT = 'id, storage_path, submitted_by, created_at, approved, kind'
const PHOTO_SELECT_LEGACY = 'id, storage_path, submitted_by, created_at, approved'

function mapPhoto(row: PhotoRow, publicUrl: string): Photo {
  return {
    id: row.id,
    storage_path: row.storage_path,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    approved: row.approved !== false,
    kind: parsePhotoKind(row.kind),
    publicUrl,
  }
}

function withPublicUrl(row: PhotoRow): Photo {
  const client = requireSupabase()
  const { data: urlData } = client.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path)
  return mapPhoto(row, urlData.publicUrl)
}

function migrationHint(error: { code?: string; message: string }): Error | null {
  if (error.code === 'PGRST204' || /approved|kind/.test(error.message)) {
    return new Error(
      'Falta rodar a migration no Supabase (supabase/migration-photo-moderation.sql e migration-party-chat-live.sql).',
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

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
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

type FetchOpts = {
  approvedOnly: boolean | null
  kind: PhotoKind | null
}

async function fetchPhotoRows({ approvedOnly, kind }: FetchOpts): Promise<Photo[]> {
  const client = requireSupabase()
  let query = client.from('photos').select(PHOTO_SELECT).order('created_at', { ascending: false })
  if (approvedOnly === true) query = query.eq('approved', true)
  if (approvedOnly === false) query = query.eq('approved', false)
  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) {
    if (error.code === 'PGRST204' || /kind|approved/.test(error.message)) {
      let legacy = client
        .from('photos')
        .select(PHOTO_SELECT_LEGACY)
        .order('created_at', { ascending: false })
      if (approvedOnly === true) legacy = legacy.eq('approved', true)
      if (approvedOnly === false) legacy = legacy.eq('approved', false)
      const fallback = await legacy
      if (fallback.error) {
        if (fallback.error.code === 'PGRST204' || /approved/.test(fallback.error.message)) {
          const oldest = await client
            .from('photos')
            .select('id, storage_path, submitted_by, created_at')
            .order('created_at', { ascending: false })
          if (oldest.error) throw oldest.error
          const rows = ((oldest.data as PhotoRow[] | null) ?? []).map(withPublicUrl)
          return kind ? rows.filter((photo) => photo.kind === kind) : rows
        }
        throw fallback.error
      }
      const rows = ((fallback.data as PhotoRow[] | null) ?? []).map(withPublicUrl)
      return kind ? rows.filter((photo) => photo.kind === kind) : rows
    }
    throw error
  }

  return ((data as PhotoRow[] | null) ?? []).map(withPublicUrl)
}

/** Galeria pública de decoração: só aprovadas kind=decor. */
export async function listPhotos(): Promise<Photo[]> {
  return fetchPhotoRows({ approvedOnly: true, kind: 'decor' })
}

/**
 * Fundo da home/guide: preferem decor aprovadas; se ainda não houver nenhuma,
 * usa as decor enviadas (pra o mosaico não ficar vazio no começo).
 */
export async function listMosaicPhotos(): Promise<Photo[]> {
  const approved = await fetchPhotoRows({ approvedOnly: true, kind: 'decor' })
  if (approved.length > 0) return approved
  return fetchPhotoRows({ approvedOnly: null, kind: 'decor' })
}

/** Fila do anfitrião: pendentes de revisão (só decoração). */
export async function listPendingPhotos(): Promise<Photo[]> {
  return fetchPhotoRows({ approvedOnly: false, kind: 'decor' })
}

/** Mural da festa na TV. */
export async function listLivePhotos(): Promise<Photo[]> {
  return fetchPhotoRows({ approvedOnly: true, kind: 'live' })
}

export async function uploadPhoto(input: PhotoInput): Promise<Photo> {
  assertImageFile(input.file)
  if (input.file.size > MAX_PHOTO_BYTES * 3) {
    throw new Error('Arquivo muito grande. Escolha uma imagem menor que ~15 MB.')
  }

  const kind: PhotoKind = input.kind === 'live' ? 'live' : 'decor'
  const blob = await compressImage(input.file)
  const ext = extensionFor(blob, input.file.name)
  const path = `${crypto.randomUUID()}.${ext}`
  const submittedBy = input.submittedBy?.trim() || null

  const client = requireSupabase()
  const { error: uploadError } = await client.storage.from(PHOTO_BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  })

  if (uploadError) throw uploadError

  const { data, error } = await client
    .from('photos')
    .insert({
      storage_path: path,
      submitted_by: submittedBy,
      approved: kind === 'live',
      kind,
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

export function subscribeToLivePhotos(onChange: () => void): () => void {
  const client = requireSupabase()
  const channel = client
    .channel('party-live-photos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, onChange)
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
