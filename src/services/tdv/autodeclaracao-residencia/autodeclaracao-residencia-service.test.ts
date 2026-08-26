import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { AutodeclaracaoResidenciaService } from './autodeclaracao-residencia-service'

const cpf = '34324084807'
const authHeader = `Bearer h.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.s`

function build (client: Partial<DetranSpServiceNowTdvClient> = {}) {
  const criaAutodeclaracaoResidencia = client.criaAutodeclaracaoResidencia ?? vi.fn().mockResolvedValue({
    result: { autodeclaracaoResidencia: 'Eu, …' }
  })
  const service = new AutodeclaracaoResidenciaService({
    detranSpServiceNowTdv: { ...client, criaAutodeclaracaoResidencia } as DetranSpServiceNowTdvClient
  })
  return { service, criaAutodeclaracaoResidencia }
}

describe('AutodeclaracaoResidenciaService', () => {
  it('forwards the address as it came, trimmed', async () => {
    const { service, criaAutodeclaracaoResidencia } = build()

    await expect(service.run(authHeader, {
      logradouro: ' RUA BOA VISTA ',
      numero: '209',
      complemento: 'CASA 2',
      bairro: 'CENTRO',
      municipio: 'SAO PAULO',
      uf: 'SP',
      nomeUF: 'São Paulo'
    })).resolves.toEqual({ autodeclaracaoResidencia: 'Eu, …' })

    expect(criaAutodeclaracaoResidencia).toHaveBeenCalledWith(expect.anything(), cpf, {
      logradouro: 'RUA BOA VISTA',
      numero: '209',
      complemento: 'CASA 2',
      bairro: 'CENTRO',
      municipio: 'SAO PAULO',
      uf: 'SP',
      nomeUF: 'São Paulo'
    })
  })

  it('renders the declaration without the município when the CV has none', async () => {
    // Origem 4 comunicações de venda arrive with nomeMunicipioComprador null. Per the DETRAN,
    // the declaration is shown with the gap — not blocked, not filled in from elsewhere.
    const { service, criaAutodeclaracaoResidencia } = build({
      criaAutodeclaracaoResidencia: vi.fn().mockResolvedValue({
        result: {
          autodeclaracaoResidencia:
            'Eu, JOSILDO LIMA, … resido em RUA BOA VISTA nº 10, bairro CENTRO, no município de , no estado de .'
        }
      })
    })

    const { autodeclaracaoResidencia } = await service.run(authHeader, {
      logradouro: 'RUA BOA VISTA',
      numero: '10',
      bairro: 'CENTRO',
      uf: 'SP'
    })

    expect(autodeclaracaoResidencia).toContain('RUA BOA VISTA')
    expect(criaAutodeclaracaoResidencia).toHaveBeenCalledWith(
      expect.anything(),
      cpf,
      expect.objectContaining({ municipio: '', nomeUF: '' })
    )
  })

  it('never looks the address up anywhere else', async () => {
    const buscaEndereco = vi.fn()
    const { service } = build({ buscaEndereco })

    await service.run(authHeader, { logradouro: 'RUA BOA VISTA' })

    expect(buscaEndereco).not.toHaveBeenCalled()
  })
})
