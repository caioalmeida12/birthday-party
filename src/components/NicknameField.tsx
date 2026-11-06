import { useState } from 'react'
import { getRememberedGuestName, rememberGuestName } from '../lib/guestProfile'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function NicknameField({
  value,
  onChange,
  placeholder = 'Seu nome',
}: Props) {
  const [remembered] = useState(() => getRememberedGuestName())
  const [editing, setEditing] = useState(false)
  const showingRemembered = Boolean(remembered) && value === remembered && !editing

  if (showingRemembered) {
    return null
  }

  return (
    <label>
      Seu apelido {remembered ? '' : '(opcional)'}
      <input
        name="name"
        autoComplete="name"
        autoCapitalize="words"
        value={value}
        onChange={(e) => {
          setEditing(true)
          onChange(e.target.value)
        }}
        onBlur={() => rememberGuestName(value)}
        placeholder={placeholder}
      />
      {remembered ? (
        <span className="field-hint">É o nome que você usou ao entrar — pode mudar se quiser.</span>
      ) : (
        <span className="field-hint">A gente guarda neste celular pra próxima vez.</span>
      )}
    </label>
  )
}
