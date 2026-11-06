import { describe, expect, it } from 'vitest'
import { buildIcs, googleCalendarUrl } from './calendarLink'

describe('calendarLink', () => {
  it('monta link do Google Agenda com data e local', () => {
    const url = googleCalendarUrl()
    expect(url).toContain('calendar.google.com/calendar/render')
    expect(url).toContain('dates=20261114T190000%2F20261115T020000')
    expect(url).toContain('Jatob')
  })

  it('gera ics com início e fim em UTC', () => {
    const ics = buildIcs()
    expect(ics).toContain('DTSTART:20261114T220000Z')
    expect(ics).toContain('DTEND:20261115T050000Z')
    expect(ics).toContain('BEGIN:VEVENT')
  })
})
