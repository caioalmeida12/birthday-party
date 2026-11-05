export type YouTubePlayer = {
  destroy: () => void
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  loadVideoById: (videoId: string) => void
  cueVideoById: (videoId: string) => void
  getPlayerState: () => number
}

type YouTubePlayerOptions = {
  width?: string | number
  height?: string | number
  videoId?: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void
    onError?: (event: { data: number; target: YouTubePlayer }) => void
  }
}

type YouTubeNamespace = {
  Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer
  PlayerState: {
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const timeout = window.setTimeout(() => {
      reject(new Error('Timeout ao carregar o player do YouTube.'))
    }, 15000)

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout)
      previous?.()
      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        reject(new Error('API do YouTube indisponível.'))
      }
    }

    if (!document.querySelector('script[data-youtube-iframe-api]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      tag.dataset.youtubeIframeApi = 'true'
      tag.onerror = () => {
        window.clearTimeout(timeout)
        reject(new Error('Falha ao carregar o script do YouTube.'))
      }
      document.head.appendChild(tag)
    }
  })

  return apiPromise
}

export const YT_ENDED = 0
export const YT_PLAYING = 1
export const YT_PAUSED = 2
