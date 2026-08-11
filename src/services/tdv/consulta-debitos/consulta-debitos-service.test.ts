import type { Logger } from 'pino'
import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConsultaDebitosService } from './consulta-debitos-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSIsIm5hbWUiOiJKb8OjbyBEZXRyYW4iLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20ifQ.'

const input = { codigoTransferencia: 'TDV1' }

const debitosResult = {
  result: {
    debitos: [
      { descricao: 'Taxa de transferência', valor: 243.77 },
      { descricao: 'Taxa de licenciamento', valor: 120.5 }
    ],
    valorTotal: 364.27
  }
}

function pixResult (estadoQRCode: string) {
  return {
    result: {
      estadoQRCode,
      qrCode: 'PIX-QR',
      dataExpiracaoQRCode: '2026-08-11T12:00:00Z',
      idPagamentoQRCode: 'PIX-1',
      dataPagamentoQRCode: '2026-08-11T11:30:00Z'
    }
  }
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

const logger = { info: vi.fn(), warn: vi.fn() } as unknown as Logger

function buildService (client: Partial<DetranSpServiceNowTdvClient>) {
  return new ConsultaDebitosService({ detranSpServiceNowTdv: asClient(client), logger })
}

describe('ConsultaDebitosService', () => {
  it('accelerates the TDV to TAXA_SERVICO_PAGA once the PIX is detected as paid on estado 7', async () => {
    const atualizaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV1' } })
    const service = buildService({
      buscaTdv: vi.fn().mockResolvedValue({ result: { nomeComprador: 'Maria', estado: '7' } }),
      buscaDebitosTdv: vi.fn().mockResolvedValue(debitosResult),
      buscaPixQrCodeTdv: vi.fn().mockResolvedValue(pixResult('2')),
      atualizaTdv
    })

    await service.run(authorizationHeader, input)

    expect(atualizaTdv).toHaveBeenCalledWith(
      { token: expect.any(String), cpf: '05246487601' },
      'TDV1',
      { estado: '8' }
    )
  })

  it('does not accelerate again when the TDV already reached estado 8', async () => {
    const atualizaTdv = vi.fn()
    const service = buildService({
      buscaTdv: vi.fn().mockResolvedValue({ result: { nomeComprador: 'Maria', estado: '8' } }),
      buscaDebitosTdv: vi.fn().mockResolvedValue(debitosResult),
      buscaPixQrCodeTdv: vi.fn().mockResolvedValue(pixResult('2')),
      atualizaTdv
    })

    await service.run(authorizationHeader, input)

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('does not accelerate while the PIX has not been paid', async () => {
    const atualizaTdv = vi.fn()
    const service = buildService({
      buscaTdv: vi.fn().mockResolvedValue({ result: { nomeComprador: 'Maria', estado: '7' } }),
      buscaDebitosTdv: vi.fn().mockResolvedValue(debitosResult),
      buscaPixQrCodeTdv: vi.fn().mockResolvedValue(pixResult('1')),
      atualizaTdv
    })

    await service.run(authorizationHeader, input)

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('still returns the débitos when the acceleration call fails', async () => {
    const atualizaTdv = vi.fn().mockRejectedValue(new Error('estado inválido'))
    const service = buildService({
      buscaTdv: vi.fn().mockResolvedValue({ result: { nomeComprador: 'Maria', estado: '7' } }),
      buscaDebitosTdv: vi.fn().mockResolvedValue(debitosResult),
      buscaPixQrCodeTdv: vi.fn().mockResolvedValue(pixResult('2')),
      atualizaTdv
    })

    await expect(service.run(authorizationHeader, input)).resolves.toMatchObject({
      estado: 2,
      totalDebitos: 'R$ 364,27'
    })
  })
})
