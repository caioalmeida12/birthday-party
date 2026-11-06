import { PARTY_NAME } from './config'
import {
  PARTY_PLACE_FULL,
  PARTY_TIME_LABEL,
  PARTY_WHEN_SHORT,
} from './partyDetails'

/** Início: 14/11/2026 19h (horário de Fortaleza, UTC-3). Fim: 15/11 02h. */
const START_LOCAL = '20261114T190000'
const END_LOCAL = '20261115T020000'
const START_UTC = '20261114T220000Z'
const END_UTC = '20261115T050000Z'

function eventTitle(): string {
  return `Aniversário do ${PARTY_NAME}`
}

function eventDetails(): string {
  return `${PARTY_WHEN_SHORT} · ${PARTY_PLACE_FULL}`
}

/** Link do Google Agenda (abre no app/site). */
export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(),
    dates: `${START_LOCAL}/${END_LOCAL}`,
    details: eventDetails(),
    location: PARTY_PLACE_FULL,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Conteúdo .ics pra Apple Calendar / Outlook. */
export function buildIcs(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//birthday-party//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:aniversario-${PARTY_NAME.toLowerCase().replace(/\s+/g, '-')}-20261114@party`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${START_UTC}`,
    `DTEND:${END_UTC}`,
    `SUMMARY:${eventTitle()}`,
    `DESCRIPTION:${eventDetails()} · a partir das ${PARTY_TIME_LABEL}`,
    `LOCATION:${PARTY_PLACE_FULL}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(): void {
  const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'aniversario.ics'
  anchor.click()
  URL.revokeObjectURL(url)
}
