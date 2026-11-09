import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  filesFromPhotoPicker,
  guestPhotoFileInputAttrs,
  isLikelyImageFile,
} from './photoPicker'

describe('guestPhotoFileInputAttrs', () => {
  it('não força capture — galeria do celular tem que aparecer', () => {
    const attrs = guestPhotoFileInputAttrs()
    expect(attrs.type).toBe('file')
    expect(attrs.accept).toMatch(/image\//)
    expect(attrs).not.toHaveProperty('capture')
    expect(attrs).not.toHaveProperty('multiple')
  })

  it('em /fotos permite vários arquivos', () => {
    const attrs = guestPhotoFileInputAttrs({ multiple: true })
    expect(attrs.multiple).toBe(true)
    expect(attrs).not.toHaveProperty('capture')
  })

  it('Photos usa multiple; guide e input sem capture', () => {
    const photos = readFileSync(new URL('../pages/Photos.tsx', import.meta.url), 'utf8')
    const guide = readFileSync(
      new URL('../components/WelcomeGuide.tsx', import.meta.url),
      'utf8',
    )
    expect(photos).toContain('guestPhotoFileInputAttrs({ multiple: true })')
    expect(photos).toContain('filesFromPhotoPicker')
    expect(photos).not.toMatch(/capture\s*=/)
    expect(guide).toContain('guestPhotoFileInputAttrs')
    expect(guide).not.toMatch(/capture\s*=/)
    expect(guide).not.toContain('multiple: true')
  })
})

describe('filesFromPhotoPicker', () => {
  it('mantém só imagens e preserva a ordem', () => {
    const imgA = new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })
    const txt = new File([new Uint8Array([2])], 'nota.txt', { type: 'text/plain' })
    const imgB = new File([new Uint8Array([3])], 'b.HEIC', { type: '' })
    const list = {
      length: 3,
      0: imgA,
      1: txt,
      2: imgB,
      item: (index: number) => [imgA, txt, imgB][index] ?? null,
      [Symbol.iterator]: function* () {
        yield imgA
        yield txt
        yield imgB
      },
    } as unknown as FileList

    expect(filesFromPhotoPicker(list).map((file) => file.name)).toEqual(['a.jpg', 'b.HEIC'])
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
