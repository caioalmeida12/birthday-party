/** Detalhes do convite — usados no guide-in e na home. */
export const PARTY_DATE_LABEL = '14 de novembro de 2026'
export const PARTY_WEEKDAY_LABEL = 'sábado'
export const PARTY_TIME_LABEL = '19h'
export const PARTY_WHEN_SHORT = `sábado, 14/11/2026, ${PARTY_TIME_LABEL}`
export const PARTY_PLACE_NAME = 'Sítio Jatobá'
export const PARTY_PLACE_REGION = 'Canindezinho'
export const PARTY_PLACE_NOTE = 'minha casa'
export const PARTY_PLACE_FULL = `${PARTY_PLACE_NAME} (${PARTY_PLACE_NOTE}), ${PARTY_PLACE_REGION}`

export function partyInviteLine(): string {
  return `${PARTY_WHEN_SHORT} · ${PARTY_PLACE_FULL}`
}
