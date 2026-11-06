export const PARTY_NAME = import.meta.env.VITE_PARTY_NAME || 'Caio'

/** PIN do anfitrião em /tocar (fica no bundle — só barreira contra convidado curioso). */
export const HOST_PIN = String(import.meta.env.VITE_HOST_PIN || 'jatoba14')

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_BUCKET = 'party-photos'

/** Título do convite sem “Aniversário do Aniversário…”. */
export function partyInviteTitle(): string {
  const name = PARTY_NAME.trim()
  if (!name) return 'Aniversário'
  if (/^anivers[aá]rio\b/i.test(name)) return name
  return `Aniversário do ${name}`
}
