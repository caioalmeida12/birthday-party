import { describe, expect, it } from 'vitest'
import {
  assertMessageBody,
  normalizeMessageBody,
  visibleMessages,
  type PartyMessageLike,
} from './messageText'

function msg(
  partial: Partial<PartyMessageLike> & { id: string; body: string },
): PartyMessageLike {
  return {
    submitted_by: null,
    created_at: '2026-11-14T19:00:00.000Z',
    hidden_at: null,
    ...partial,
  }
}

describe('normalizeMessageBody', () => {
  it('colapsa espaços', () => {
    expect(normalizeMessageBody('  oi   festa  ')).toBe('oi festa')
  })
})

describe('assertMessageBody', () => {
  it('rejeita vazio', () => {
    expect(() => assertMessageBody('   ')).toThrow(/mensagem/i)
  })

  it('rejeita mensagem longa demais', () => {
    expect(() => assertMessageBody('x'.repeat(281))).toThrow(/280/)
  })

  it('aceita texto curto', () => {
    expect(assertMessageBody(' Cheguei! ')).toBe('Cheguei!')
  })
})

describe('visibleMessages', () => {
  it('esconde as com hidden_at', () => {
    const list = visibleMessages([
      msg({ id: '1', body: 'oi' }),
      msg({ id: '2', body: 'tchau', hidden_at: '2026-11-14T20:00:00.000Z' }),
    ])
    expect(list.map((item) => item.id)).toEqual(['1'])
  })
})
