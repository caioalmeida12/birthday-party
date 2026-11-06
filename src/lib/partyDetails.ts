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

/** Pin correto no Maps (Andréa Artes / Sítio Jatobá). */
export const PARTY_MAPS_URL =
  'https://www.google.com/maps/place/Andr%C3%A9a+Artes/@-6.7406972,-39.19028,17z/data=!3m1!4b1!4m6!3m5!1s0x7a3b1b1458539a5:0x57753f8ded422d9e!8m2!3d-6.7406972!4d-39.19028!16s%2Fg%2F11fr77j1gp'

/** Abre o lugar no Google Maps. */
export function partyMapsUrl(): string {
  return PARTY_MAPS_URL
}
