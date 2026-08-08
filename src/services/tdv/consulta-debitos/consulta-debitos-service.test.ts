import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConsultaDebitosService } from './consulta-debitos-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

describe('ConsultaDebitosService', () => {
  it('returns full debitos list with valorTotal and formatted helpers', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { nomeComprador: 'Carlos da Silva' }
    })
    const buscaDebitosTdv = vi.fn().mockResolvedValue({
      result: {
        valorTotal: 761.13,
        debitos: [
          { descricao: 'Transferência de Veículo', valor: 272.27 },
          { descricao: 'Licenciamento', valor: 160.22 },
          { descricao: 'Multa MUNICIPAL 2550 de 22/12/2023', valor: 197.18 },
          { descricao: 'Multa MUNICIPAL 2550 de 22/12/2023', valor: 131.46 }
        ]
      }
    })
    const buscaPixQrCodeTdv = vi.fn()

    const service = new ConsultaDebitosService({
      detranSpServiceNowTdv: {
        buscaTdv,
        buscaDebitosTdv,
        buscaPixQrCodeTdv
      } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' })).resolves.toEqual({
      nomeComprador: 'Carlos da Silva',
      debitos: [
        { descricao: 'Transferência de Veículo', valor: 272.27, valorFormatado: 'R$ 272,27' },
        { descricao: 'Licenciamento', valor: 160.22, valorFormatado: 'R$ 160,22' },
        { descricao: 'Multa MUNICIPAL 2550 de 22/12/2023', valor: 197.18, valorFormatado: 'R$ 197,18' },
        { descricao: 'Multa MUNICIPAL 2550 de 22/12/2023', valor: 131.46, valorFormatado: 'R$ 131,46' }
      ],
      valorTotal: 761.13,
      taxaTransferencia: 'R$ 272,27',
      taxaLicenciamento: 'R$ 160,22',
      totalDebitos: 'R$ 761,13'
    })

    expect(buscaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
    expect(buscaDebitosTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
    expect(buscaPixQrCodeTdv).not.toHaveBeenCalled()
  })
})
