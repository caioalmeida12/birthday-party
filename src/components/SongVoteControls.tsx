import type { Song } from '../lib/songs'

type Props = {
  song: Song
  disabled?: boolean
  showSkip?: boolean
  onUpvote: (songId: string) => void
  onDownvote: (songId: string) => void
  onSkipToggle?: (song: Song) => void
}

function likedLabel(count: number): string {
  if (count <= 0) return '0 gostei'
  if (count === 1) return '1 gostei'
  return `${count} gostei`
}

export function SongVoteControls({
  song,
  disabled = false,
  showSkip = false,
  onUpvote,
  onDownvote,
  onSkipToggle,
}: Props) {
  return (
    <div className="vote-controls" aria-label={`Votos para ${song.title}`}>
      <p className="vote-summary">{likedLabel(song.upvotes)}</p>
      <div className="vote-actions">
        <button
          type="button"
          className={song.myVote === 1 ? 'vote-btn vote-btn-active-up' : 'vote-btn'}
          aria-pressed={song.myVote === 1}
          disabled={disabled}
          onClick={() => onUpvote(song.id)}
        >
          Gostei
        </button>
        <button
          type="button"
          className={song.myVote === -1 ? 'vote-btn vote-btn-active-down' : 'vote-btn'}
          aria-pressed={song.myVote === -1}
          disabled={disabled}
          onClick={() => onDownvote(song.id)}
        >
          Não rolou
        </button>
        {showSkip && onSkipToggle ? (
          <button
            type="button"
            className={
              song.skipped ? 'vote-btn vote-btn-skip vote-btn-skip-on' : 'vote-btn vote-btn-skip'
            }
            aria-pressed={song.skipped}
            disabled={disabled}
            onClick={() => onSkipToggle(song)}
          >
            {song.skipped ? 'Fora da festa' : 'Tirar da festa'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
