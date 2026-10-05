import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { BuscaDocumentoCertidaoAtualService } from './busca-documento-certidao-atual-service'

function buildAuth () {
  return { accessToken: 'token', userCpf: '12345678901', renavam: '123', placa: 'ABC1234' }
}

describe('BuscaDocumentoCertidaoAtualService', () => {
  it('fetches the document by renavam/placa, without needing a certidão id', async () => {
    const buscaDocumentoCertidao = vi.fn().mockResolvedValue({
      data: { id: '1', type: 'certidao', attributes: { conteudo: 'base64-conteudo' } }
    })
    const client = { buscaDocumentoCertidao } as unknown as DetranSpServiceNowDebRestrClient
    const service = new BuscaDocumentoCertidaoAtualService(client)
    const auth = buildAuth()

    const result = await service.run(auth)

    expect(buscaDocumentoCertidao).toHaveBeenCalledWith(auth, auth.renavam)
    expect(result).toEqual({ base64: 'base64-conteudo' })
  })

  it('returns a null base64 when the upstream response has no content', async () => {
    const client = {
      buscaDocumentoCertidao: vi.fn().mockResolvedValue(null)
    } as unknown as DetranSpServiceNowDebRestrClient
    const service = new BuscaDocumentoCertidaoAtualService(client)

    const result = await service.run(buildAuth())

    expect(result).toEqual({ base64: null })
  })
})
