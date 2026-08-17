import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { formatCurrency } from '../../../utils/currency'
import { ConsultaComprasService } from './consulta-compras-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ConsultaComprasService', () => {
  it('maps each actionable TDV to its proximaAcao', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [
        { estado: '3', codigoTransferenciaVeiculo: 'TDV-A', placaVeiculo: 'AAA1111', descricaoMarcaVeiculo: 'A', codigoRenavamVeiculo: '1', nomeComprador: 'Maria', nomeVendedor: 'João', valorVendaVeiculo: '90000', kmVeiculo: '13000' },
        { estado: '7', codigoTransferenciaVeiculo: 'TDV-B', placaVeiculo: 'BBB2222', descricaoMarcaVeiculo: 'B', codigoRenavamVeiculo: '2' },
        { estado: '8', codigoTransferenciaVeiculo: 'TDV-C', placaVeiculo: 'CCC3333', descricaoMarcaVeiculo: 'C', codigoRenavamVeiculo: '3' },
        { estado: '9', codigoTransferenciaVeiculo: 'TDV-D', placaVeiculo: 'DDD4444', descricaoMarcaVeiculo: 'D', codigoRenavamVeiculo: '4' }
      ]
    })
    const service = new ConsultaComprasService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    const result = await service.run(authorizationHeader)

    expect(result.vehicles.map(v => v.proximaAcao)).toEqual(['comprador', 'comprador_2', 'pagamento_confirmado', 'concluido'])
    expect(result.vehicles[0]).toMatchObject({
      codigoTransferencia: 'TDV-A',
      plate: 'AAA1111',
      nomeComprador: 'Maria',
      nomeVendedor: 'João',
      valorVenda: formatCurrency(90000),
      quilometragem: '13.000'
    })
  })

  it('omits TDVs still waiting on the seller — nothing for the buyer to act on yet', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [
        { estado: '1', codigoTransferenciaVeiculo: 'TDV-E' },
        { estado: '2', codigoTransferenciaVeiculo: 'TDV-F' },
        { estado: '10', codigoTransferenciaVeiculo: 'TDV-G' }
      ]
    })
    const service = new ConsultaComprasService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader)).resolves.toEqual({ vehicles: [] })
  })

  it('returns an empty list when the API returns no result', async () => {
    const listaTdvs = vi.fn().mockResolvedValue(undefined)
    const service = new ConsultaComprasService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader)).resolves.toEqual({ vehicles: [] })
  })

  it('reduces nomeComprador to just the first name, title-cased, for the greeting screens', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [
        { estado: '3', codigoTransferenciaVeiculo: 'TDV-A', placaVeiculo: 'AAA1111', descricaoMarcaVeiculo: 'A', codigoRenavamVeiculo: '1', nomeComprador: 'MARIA COMPRADORA TESTE' }
      ]
    })
    const service = new ConsultaComprasService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    const result = await service.run(authorizationHeader)

    expect(result.vehicles[0]).toMatchObject({ nomeComprador: 'Maria' })
  })
})
