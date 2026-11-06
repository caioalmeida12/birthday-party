import type { Song } from '../lib/songs'

type Props = {
  songs: Song[]
  busyId: string | null
  onMove: (songId: string, direction: 'up' | 'down') => void
  onRemove: (song: Song) => void
}

export function ModerateQueue({ songs, busyId, onMove, onRemove }: Props) {
  if (songs.length === 0) {
    return <p className="muted">Nenhuma música pra moderar ainda.</p>
  }

  return (
    <ol className="song-list moderate-list">
      {songs.map((song, index) => {
        const busy = busyId === song.id
        return (
          <li
            key={song.id}
            className={song.skipped ? 'song-item song-item-skipped' : 'song-item'}
          >
            <div className="moderate-row">
              <div className="moderate-main">
                <span className="queue-index">{index + 1}</span>
                <div>
                  <strong>{song.title}</strong>
                  <span className="song-artist">{song.artist}</span>
                  {song.submitted_by ? (
                    <span className="song-by">por {song.submitted_by}</span>
                  ) : null}
                  <span className="vote-summary">
                    {song.upvotes > 0
                      ? `${song.upvotes} gostaram`
                      : 'Ninguém gostou ainda'}
                    {song.skipped ? ' · fora da rotação' : ''}
                  </span>
                </div>
              </div>
              <div className="moderate-actions">
                <button
                  type="button"
                  className="vote-btn"
                  disabled={busy || index === 0}
                  aria-label="Subir na fila"
                  onClick={() => onMove(song.id, 'up')}
                >
                  Subir
                </button>
                <button
                  type="button"
                  className="vote-btn"
                  disabled={busy || index === songs.length - 1}
                  aria-label="Descer na fila"
                  onClick={() => onMove(song.id, 'down')}
                >
                  Descer
                </button>
                <button
                  type="button"
                  className="vote-btn vote-btn-active-down"
                  disabled={busy}
                  aria-label="Remover de vez"
                  onClick={() => onRemove(song)}
                >
                  Remover
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
