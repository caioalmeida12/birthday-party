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
  placeholder = 'Como te chamam na festa',
}: Props) {
  const [remembered] = useState(() => getRememberedGuestName())
  const showingRemembered = Boolean(remembered) && value === remembered

  return (
    <label>
      Seu apelido {remembered ? '' : '(opcional)'}
      <input
        name="name"
        autoComplete="name"
        autoCapitalize="words"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => rememberGuestName(value)}
        placeholder={placeholder}
      />
      {showingRemembered ? (
        <span className="field-hint">É o nome que você usou ao entrar — pode mudar se quiser.</span>
      ) : (
        <span className="field-hint">A gente guarda neste celular pra próxima vez.</span>
      )}
    </label>
  )
}
