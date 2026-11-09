import { describe, expect, it, vi } from 'vitest'
import {
  extensionForPhotoBlob,
  isHeicLikeFile,
  isHeicPhotoUrl,
  preparePhotoBlob,
  resolveDisplayablePhotoSrc,
} from './preparePhotoBlob'

function heicFile(name = 'IMG_1.HEIC'): File {
  return new File([new Uint8Array([0, 1, 2])], name, { type: 'image/heic' })
}

describe('isHeicPhotoUrl', () => {
  it('detecta path .heic mesmo com query', () => {
    expect(
      isHeicPhotoUrl('https://x.supabase.co/storage/v1/object/public/party-photos/a.heic'),
    ).toBe(true)
    expect(
      isHeicPhotoUrl('https://x.supabase.co/storage/v1/object/public/party-photos/a.HEIC?v=1'),
    ).toBe(true)
    expect(
      isHeicPhotoUrl('https://x.supabase.co/storage/v1/object/public/party-photos/a.jpg'),
    ).toBe(false)
  })
})

describe('preparePhotoBlob', () => {
  it('converte HEIC pra JPEG e nunca devolve HEIC', async () => {
    const jpeg = new Blob([new Uint8Array([9])], { type: 'image/jpeg' })
    const convert = vi.fn(async () => jpeg)

    const result = await preparePhotoBlob(heicFile(), {
      heicToJpeg: convert,
      maxBytes: 5 * 1024 * 1024,
    })

    expect(convert).toHaveBeenCalledOnce()
    expect(result.type).toBe('image/jpeg')
    expect(result.type).not.toMatch(/heic|heif/i)
  })

  it('falha se a conversão HEIC não rodar — não sobe HEIC cru', async () => {
    await expect(
      preparePhotoBlob(heicFile(), {
        heicToJpeg: async () => {
          throw new Error('decode fail')
        },
      }),
    ).rejects.toThrow(/HEIC|compatível/i)
  })

  it('rejeita conversão que ainda devolve HEIC', async () => {
    await expect(
      preparePhotoBlob(heicFile(), {
        heicToJpeg: async () => new Blob([new Uint8Array([1])], { type: 'image/heic' }),
      }),
    ).rejects.toThrow(/HEIC/)
  })
})

describe('extensionForPhotoBlob', () => {
  it('força jpg quando a origem era heic', () => {
    expect(
      extensionForPhotoBlob(new Blob([], { type: 'image/jpeg' }), 'foto.HEIC'),
    ).toBe('jpg')
    expect(isHeicLikeFile(heicFile())).toBe(true)
  })
})

describe('resolveDisplayablePhotoSrc', () => {
  it('converte URL HEIC pra object URL JPEG', async () => {
    const jpeg = new Blob([new Uint8Array([7])], { type: 'image/jpeg' })
    const fetchMock = vi.fn(async () =>
      new Response(new Blob([new Uint8Array([1])], { type: 'image/heic' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const createObjectURL = vi.fn(() => 'blob:mock-heic')
    vi.stubGlobal('URL', { ...URL, createObjectURL })

    const src = await resolveDisplayablePhotoSrc(
      'https://cdn.example/party-photos/x.heic',
      { heicToJpeg: async () => jpeg },
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(src).toBe('blob:mock-heic')
    vi.unstubAllGlobals()
  })
})
