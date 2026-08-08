import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { BuscaPixService } from './busca-pix-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

describe('BuscaPixService', () => {
  it('passes forcarNovo to the client and maps SN fields', async () => {
    const buscaPixQrCodeTdv = vi.fn().mockResolvedValue({
      result: {
        idQRCode: '12345',
        qrCode: '00020101021226830014BR.GOV.BCB.PIX2551qrcodesample...',
        estadoQRCode: 1,
        dataExpiracaoQRCode: '2024-09-19T14:30:00Z'
      }
    })

    const service = new BuscaPixService({
      detranSpServiceNowTdv: { buscaPixQrCodeTdv } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      forcarNovo: true
    })).resolves.toEqual({
      qrCode: '00020101021226830014BR.GOV.BCB.PIX2551qrcodesample...',
      expiresAt: '2024-09-19T14:30:00Z',
      estado: 1
    })

    expect(buscaPixQrCodeTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', { forcarNovo: true })
  })

  it('normalizes string estadoQRCode and maps payment fields', async () => {
    const buscaPixQrCodeTdv = vi.fn().mockResolvedValue({
      result: {
        idQRCode: '12345',
        qrCode: '00020101021226830014BR.GOV.BCB.PIX2551qrcodesample...',
        estadoQRCode: '2',
        idPagamentoQRCode: '98765',
        dataPagamentoQRCode: '2024-09-19T14:30:00Z',
        dataExpiracaoQRCode: '2024-09-19T14:45:00Z'
      }
    })

    const service = new BuscaPixService({
      detranSpServiceNowTdv: { buscaPixQrCodeTdv } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      forcarNovo: false
    })).resolves.toEqual({
      qrCode: '00020101021226830014BR.GOV.BCB.PIX2551qrcodesample...',
      expiresAt: '2024-09-19T14:45:00Z',
      estado: 2,
      idPagamento: '98765',
      dataPagamento: '19/09/2024 11:30'
    })

    expect(buscaPixQrCodeTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', { forcarNovo: false })
  })

  it('normalizes label estadoQRCode values to 1|2|3', async () => {
    const buscaPixQrCodeTdv = vi.fn()
      .mockResolvedValueOnce({
        result: {
          qrCode: 'qr',
          estadoQRCode: 'expirado',
          dataExpiracaoQRCode: '2024-09-19T14:30:00Z'
        }
      })
      .mockResolvedValueOnce({
        result: {
          qrCode: 'qr',
          estadoQRCode: 'pago',
          idPagamentoQRCode: '98765',
          dataPagamentoQRCode: '2024-09-19T14:30:00Z',
          dataExpiracaoQRCode: '2024-09-19T14:45:00Z'
        }
      })

    const service = new BuscaPixService({
      detranSpServiceNowTdv: { buscaPixQrCodeTdv } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      forcarNovo: false
    })).resolves.toMatchObject({ estado: 3 })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      forcarNovo: false
    })).resolves.toMatchObject({
      estado: 2,
      idPagamento: '98765',
      dataPagamento: '19/09/2024 11:30'
    })
  })

  it('rejects missing codigoTransferencia', async () => {
    const service = new BuscaPixService({
      detranSpServiceNowTdv: {} as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { codigoTransferencia: '  ' }))
      .rejects.toMatchObject({ status: 400, message: 'codigoTransferencia é obrigatório' })
  })
})
