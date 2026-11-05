import { resolveMusicMetadata } from './resolveMusicMetadata'
import { requireSupabase } from './supabase'
import { isAllowedMusicUrl, normalizeMusicUrl } from './urlValidation'

export type Song = {
  id: string
  title: string
  artist: string
  url: string
  submitted_by: string | null
  created_at: string
}

export type SongInput = {
  url: string
  submittedBy?: string
}

export async function listSongs(): Promise<Song[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('songs')
    .select('id, title, artist, url, submitted_by, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createSong(input: SongInput): Promise<Song> {
  const url = normalizeMusicUrl(input.url)
  const submittedBy = input.submittedBy?.trim() || null

  if (!isAllowedMusicUrl(url)) {
    throw new Error(
      'Use um link do Spotify (open.spotify.com) ou YouTube (youtube.com / youtu.be).',
    )
  }

  const metadata = await resolveMusicMetadata(url)

  const client = requireSupabase()
  const { data, error } = await client
    .from('songs')
    .insert({
      title: metadata.title,
      artist: metadata.artist,
      url: metadata.url,
      submitted_by: submittedBy,
    })
    .select('id, title, artist, url, submitted_by, created_at')
    .single()

  if (error) throw error
  return data
}
