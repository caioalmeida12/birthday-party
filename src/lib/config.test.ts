import { describe, expect, it } from 'vitest'
import { partyInviteTitle } from './config'

describe('partyInviteTitle', () => {
  it('não duplica a palavra aniversário', () => {
    // Função usa PARTY_NAME do env/build; o default local é "Caio".
    expect(partyInviteTitle()).not.toMatch(/Aniversário do Aniversário/i)
  })
})
