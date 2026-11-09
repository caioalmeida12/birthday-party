import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { guestPhotoFileInputAttrs, isLikelyImageFile } from './photoPicker'

describe('guestPhotoFileInputAttrs', () => {
  it('não força capture — galeria do celular tem que aparecer', () => {
    const attrs = guestPhotoFileInputAttrs()
    expect(attrs.type).toBe('file')
    expect(attrs.accept).toMatch(/image\//)
    expect(attrs).not.toHaveProperty('capture')
  })

  it('Photos e guide usam o picker sem capture', () => {
    const photos = readFileSync(new URL('../pages/Photos.tsx', import.meta.url), 'utf8')
    const guide = readFileSync(
      new URL('../components/WelcomeGuide.tsx', import.meta.url),
      'utf8',
    )
    expect(photos).toContain('guestPhotoFileInputAttrs')
    expect(photos).not.toMatch(/capture\s*=/)
    expect(guide).toContain('guestPhotoFileInputAttrs')
    expect(guide).not.toMatch(/capture\s*=/)
  })
})
describe('isLikelyImageFile', () => {
  it('aceita HEIC da galeria iOS sem MIME', () => {
    const file = new File([new Uint8Array([0])], 'IMG_1234.HEIC', { type: '' })
    expect(isLikelyImageFile(file)).toBe(true)
  })

  it('rejeita arquivo que não é imagem', () => {
    const file = new File([new Uint8Array([0])], 'nota.txt', { type: 'text/plain' })
    expect(isLikelyImageFile(file)).toBe(false)
  })
})
