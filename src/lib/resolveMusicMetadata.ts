import { isAllowedMusicUrl, normalizeMusicUrl } from './urlValidation'

export type MusicMetadata = {
  title: string
  artist: string
  url: string
  provider: 'spotify' | 'youtube'
}

type OEmbedResponse = {
  title?: string
  author_name?: string
  provider_name?: string
}

function isSpotifyHost(hostname: string): boolean {
  return hostname === 'open.spotify.com'
}

function isYouTubeHost(hostname: string): boolean {
  return (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'music.youtube.com' ||
    hostname === 'youtu.be'
  )
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao consultar metadados (${response.status}).`)
  }
  return (await response.json()) as T
}

async function fetchOEmbed(oembedUrl: string): Promise<OEmbedResponse> {
  return fetchJson<OEmbedResponse>(oembedUrl)
}

function stripVideoNoise(value: string): string {
  return value
    .replace(/\s*[([].*?\bofficial\s*(music\s*)?video(?:\s*remastered)?.*?[)\]]\s*/gi, ' ')
    .replace(/\s*[([].*?\bofficial\s*audio.*?[)\]]\s*/gi, ' ')
    .replace(/\s*[([].*?\blyric\s*videos?\b.*?[)\]]\s*/gi, ' ')
    .replace(/\s*[([].*?\blyrics?\b.*?[)\]]\s*/gi, ' ')
    .replace(/\s*[([(]?\b(?:hd|4k|remaster(?:ed)?)\b[)\]]?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function cleanChannelName(channel: string): string {
  return channel
    .replace(/\s*[-–—]?\s*topic$/i, '')
    .replace(/\s+vevo$/i, '')
    .replace(/\s+official$/i, '')
    .trim()
}

export function parseYouTubeMetadata(
  rawTitle: string,
  channelName = '',
): Pick<MusicMetadata, 'title' | 'artist'> {
  const cleaned = stripVideoNoise(rawTitle)
  const separators = [' – ', ' — ', ' - ', ' | ']

  for (const separator of separators) {
    const index = cleaned.indexOf(separator)
    if (index <= 0) continue
    const left = cleaned.slice(0, index).trim()
    const right = cleaned.slice(index + separator.length).trim()
    if (left && right) {
      return { artist: left, title: right }
    }
  }

  const artist = cleanChannelName(channelName) || 'YouTube'
  return { title: cleaned || rawTitle.trim(), artist }
}

type ItunesSearchResponse = {
  results?: Array<{
    trackName?: string
    artistName?: string
  }>
}

async function lookupArtistOnItunes(trackTitle: string): Promise<string | null> {
  const endpoint =
    'https://itunes.apple.com/search?' +
    new URLSearchParams({
      term: trackTitle,
      entity: 'song',
      limit: '8',
      country: 'BR',
    }).toString()

  const data = await fetchJson<ItunesSearchResponse>(endpoint)
  const results = data.results ?? []
  if (results.length === 0) return null

  const normalizedTitle = trackTitle.trim().toLowerCase()
  const exact = results.find(
    (item) => item.trackName?.trim().toLowerCase() === normalizedTitle && item.artistName,
  )
  if (exact?.artistName) return exact.artistName.trim()

  const startsWith = results.find(
    (item) =>
      item.trackName?.trim().toLowerCase().startsWith(normalizedTitle) && item.artistName,
  )
  if (startsWith?.artistName) return startsWith.artistName.trim()

  return results[0]?.artistName?.trim() || null
}

async function resolveSpotify(url: string): Promise<MusicMetadata> {
  const oembed = await fetchOEmbed(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
  )
  const title = oembed.title?.trim()
  if (!title) {
    throw new Error('Não achei o nome dessa faixa no Spotify.')
  }

  let artist = oembed.author_name?.trim() || null
  if (!artist) {
    try {
      artist = await lookupArtistOnItunes(title)
    } catch {
      artist = null
    }
  }

  return {
    title,
    artist: artist || 'Desconhecido',
    url,
    provider: 'spotify',
  }
}

async function resolveYouTube(url: string): Promise<MusicMetadata> {
  let oembed: OEmbedResponse
  try {
    oembed = await fetchOEmbed(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    )
  } catch {
    oembed = await fetchOEmbed(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
    )
  }

  const rawTitle = oembed.title?.trim()
  if (!rawTitle) {
    throw new Error('Não achei o título desse vídeo no YouTube.')
  }

  const parsed = parseYouTubeMetadata(rawTitle, oembed.author_name ?? '')
  return {
    ...parsed,
    url,
    provider: 'youtube',
  }
}

export async function resolveMusicMetadata(rawUrl: string): Promise<MusicMetadata> {
  const url = normalizeMusicUrl(rawUrl)
  if (!isAllowedMusicUrl(url)) {
    throw new Error(
      'Use um link do Spotify (open.spotify.com) ou YouTube (youtube.com / youtu.be).',
    )
  }

  const hostname = new URL(url).hostname.toLowerCase()
  if (isSpotifyHost(hostname)) {
    return resolveSpotify(url)
  }
  if (isYouTubeHost(hostname)) {
    return resolveYouTube(url)
  }

  throw new Error('Provedor de música não suportado.')
}
