import type { Song } from '../lib/songs'

type Props = {
  song: Song
  disabled?: boolean
  onUpvote: (songId: string) => void
  onDownvote: (songId: string) => void
  onSkipToggle: (song: Song) => void
}

export function SongVoteControls({
  song,
  disabled = false,
  onUpvote,
  onDownvote,
  onSkipToggle,
}: Props) {
  return (
    <div className="vote-controls" aria-label={`Votos para ${song.title}`}>
      <button
        type="button"
        className={song.myVote === 1 ? 'vote-btn vote-btn-active-up' : 'vote-btn'}
        aria-pressed={song.myVote === 1}
        aria-label="Curtir"
        disabled={disabled}
        onClick={() => onUpvote(song.id)}
      >
        ▲ <span>{song.upvotes}</span>
      </button>
      <span className={song.score > 0 ? 'vote-score vote-score-pos' : song.score < 0 ? 'vote-score vote-score-neg' : 'vote-score'}>
        {song.score > 0 ? `+${song.score}` : song.score}
      </span>
      <button
        type="button"
        className={song.myVote === -1 ? 'vote-btn vote-btn-active-down' : 'vote-btn'}
        aria-pressed={song.myVote === -1}
        aria-label="Não curtir"
        disabled={disabled}
        onClick={() => onDownvote(song.id)}
      >
        ▼ <span>{song.downvotes}</span>
      </button>
      <button
        type="button"
        className={song.skipped ? 'vote-btn vote-btn-skip vote-btn-skip-on' : 'vote-btn vote-btn-skip'}
        aria-pressed={song.skipped}
        aria-label={song.skipped ? 'Tirar skip' : 'Skip'}
        disabled={disabled}
        onClick={() => onSkipToggle(song)}
      >
        {song.skipped ? 'Skipped' : 'Skip'}
      </button>
    </div>
  )
}
