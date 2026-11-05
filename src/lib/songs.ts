import { resolveMusicMetadata } from './resolveMusicMetadata'
import { requireSupabase } from './supabase'
import { isAllowedMusicUrl, normalizeMusicUrl } from './urlValidation'
import { getVoterKey } from './voter'

export type Song = {
  id: string
  title: string
  artist: string
  url: string
  submitted_by: string | null
  created_at: string
  upvotes: number
  downvotes: number
  score: number
  skipped: boolean
  myVote: -1 | 0 | 1
}

export type SongInput = {
  url: string
  submittedBy?: string
}

type SongRow = {
  id: string
  title: string
  artist: string
  url: string
  submitted_by: string | null
  created_at: string
  song_votes?: Array<{ vote: number; voter_key: string }> | null
  song_skips?: Array<{ song_id: string }> | null
}

function mapSong(row: SongRow, voterKey: string): Song {
  const votes = row.song_votes ?? []
  let upvotes = 0
  let downvotes = 0
  let myVote: -1 | 0 | 1 = 0

  for (const entry of votes) {
    if (entry.vote === 1) upvotes += 1
    if (entry.vote === -1) downvotes += 1
    if (entry.voter_key === voterKey) {
      myVote = entry.vote === -1 ? -1 : 1
    }
  }

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    url: row.url,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    skipped: (row.song_skips?.length ?? 0) > 0,
    myVote,
  }
}

export function sortSongsForQueue(songs: Song[]): Song[] {
  return [...songs]
    .filter((song) => !song.skipped)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.created_at.localeCompare(b.created_at)
    })
}

export function sortSongsForBoard(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1
    if (b.score !== a.score) return b.score - a.score
    return b.created_at.localeCompare(a.created_at)
  })
}

export async function listSongs(): Promise<Song[]> {
  const client = requireSupabase()
  const voterKey = getVoterKey()
  const { data, error } = await client
    .from('songs')
    .select(
      'id, title, artist, url, submitted_by, created_at, song_votes(vote, voter_key), song_skips(song_id)',
    )
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || /song_votes|song_skips/.test(error.message)) {
      throw new Error(
        'Falta rodar a migration de votos no Supabase (supabase/migration-votes-skip.sql).',
      )
    }
    throw error
  }
  return ((data as SongRow[] | null) ?? []).map((row) => mapSong(row, voterKey))
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
    .select(
      'id, title, artist, url, submitted_by, created_at, song_votes(vote, voter_key), song_skips(song_id)',
    )
    .single()

  if (error) throw error
  return mapSong(data as SongRow, getVoterKey())
}

export async function castSongVote(songId: string, vote: 1 | -1): Promise<Song[]> {
  const client = requireSupabase()
  const voterKey = getVoterKey()

  const { data: existing, error: existingError } = await client
    .from('song_votes')
    .select('vote')
    .eq('song_id', songId)
    .eq('voter_key', voterKey)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.vote === vote) {
    const { error } = await client
      .from('song_votes')
      .delete()
      .eq('song_id', songId)
      .eq('voter_key', voterKey)
    if (error) throw error
  } else if (existing) {
    const { error } = await client
      .from('song_votes')
      .update({ vote })
      .eq('song_id', songId)
      .eq('voter_key', voterKey)
    if (error) throw error
  } else {
    const { error } = await client.from('song_votes').insert({
      song_id: songId,
      voter_key: voterKey,
      vote,
    })
    if (error) throw error
  }

  return listSongs()
}

export async function skipSong(songId: string): Promise<Song[]> {
  const client = requireSupabase()
  const { error } = await client.from('song_skips').upsert({
    song_id: songId,
    skipped_by: getVoterKey(),
  })
  if (error) throw error
  return listSongs()
}

export async function unskipSong(songId: string): Promise<Song[]> {
  const client = requireSupabase()
  const { error } = await client.from('song_skips').delete().eq('song_id', songId)
  if (error) throw error
  return listSongs()
}

export function subscribeToPlaylist(onChange: () => void): () => void {
  const client = requireSupabase()
  const channel = client
    .channel('party-playlist')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'song_votes' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'song_skips' }, onChange)
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
