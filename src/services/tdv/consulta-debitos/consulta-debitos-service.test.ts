import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConsultaDebitosService } from './consulta-debitos-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

describe('ConsultaDebitosService', () => {
  it('returns debitos list together with pix qr fields', async () => {
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
    const buscaPixQrCodeTdv = vi.fn().mockResolvedValue({
      result: {
        idQRCode: 'QR-1',
        qrCode: '00020126...',
        dataExpiracaoQRCode: '2026-08-11T15:00:00.000Z',
        estadoQRCode: '1',
        idPagamentoQRCode: '',
        dataPagamentoQRCode: ''
      }
    })

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
      totalDebitos: 'R$ 761,13',
      qrCode: '00020126...',
      expiresAt: '2026-08-11T15:00:00.000Z',
      estado: 1,
      comprovante: undefined,
      confirmedDate: undefined
    })

    expect(buscaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
    expect(buscaDebitosTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
    expect(buscaPixQrCodeTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', true)
  })
})
