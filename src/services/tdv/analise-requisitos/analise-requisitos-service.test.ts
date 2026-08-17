import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { AnaliseRequisitosService } from './analise-requisitos-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

const selectedVehicle = { plate: 'ABC1D23', renavam: '00001002003' }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('AnaliseRequisitosService', () => {
  it('routes straight to vendedor_2 when the buyer already signed', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '6', codigoTransferenciaVeiculo: 'TDV-1' }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader, { selectedVehicle })).resolves.toEqual({
      hasRestriction: false,
      hasActiveTDV: true,
      codigoTransferencia: 'TDV-1',
      estado: '6',
      proximaAcao: 'vendedor_2'
    })
  })

  it('leaves proximaAcao unset when the TDV was just created (state 1, no sale data yet) so the seller sees the cancel-eligible "TDV aberta?" prompt', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '1', codigoTransferenciaVeiculo: 'TDV-2' }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    const result = await service.run(authorizationHeader, { selectedVehicle })

    expect(result.hasActiveTDV).toBe(true)
    expect(result.estado).toBe('1')
    expect(result.proximaAcao).toBeUndefined()
  })

  it('leaves proximaAcao unset when sale data was already informed (state 2, not yet confirmed) so the seller sees the cancel-eligible "TDV aberta?" prompt', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '2', codigoTransferenciaVeiculo: 'TDV-3' }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    const result = await service.run(authorizationHeader, { selectedVehicle })

    expect(result.hasActiveTDV).toBe(true)
    expect(result.estado).toBe('2')
    expect(result.proximaAcao).toBeUndefined()
  })

  it('leaves proximaAcao unset when the TDV is waiting on the buyer', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '7', codigoTransferenciaVeiculo: 'TDV-4' }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    const result = await service.run(authorizationHeader, { selectedVehicle })

    expect(result.hasActiveTDV).toBe(true)
    expect(result.proximaAcao).toBeUndefined()
  })

  it('routes to nova_tdv when there is no active TDV for the vehicle', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({ result: [] })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader, { selectedVehicle })).resolves.toEqual({
      hasRestriction: false,
      hasActiveTDV: false,
      proximaAcao: 'nova_tdv'
    })
  })

  it('surfaces origem 5 and loja buyer fields so the seller flow can branch to Confirmação dados loja', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{
        estado: '2',
        codigoTransferenciaVeiculo: 'TDV-LOJA',
        origem: '5',
        codigoComprador: '16794464003768',
        nomeComprador: 'CAOA MOTOR DO BRASIL LTDA',
        emailComprador: 'CERTIDOCPJ@EMAIL.COM',
        logradouroComprador: 'Avenida Conselheiro Nébias',
        numeroComprador: '240',
        bairroComprador: 'Encruzilhada',
        nomeMunicipioComprador: 'Santos',
        ufComprador: 'SP',
        cepComprador: '11045001'
      }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader, { selectedVehicle })).resolves.toEqual({
      hasRestriction: false,
      hasActiveTDV: true,
      codigoTransferencia: 'TDV-LOJA',
      estado: '2',
      origem: '5',
      cpfComprador: '16794464003768',
      nomeComprador: 'CAOA MOTOR DO BRASIL LTDA',
      emailComprador: 'CERTIDOCPJ@EMAIL.COM',
      enderecoComprador: 'Avenida Conselheiro Nébias, 240, Encruzilhada, Santos - SP, 11045001'
    })
  })

  it('ignores cancelled TDVs when looking for an active one', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '10', codigoTransferenciaVeiculo: 'TDV-5' }]
    })
    const service = new AnaliseRequisitosService({ detranSpServiceNowTdv: asClient({ listaTdvs }) })

    await expect(service.run(authorizationHeader, { selectedVehicle })).resolves.toEqual({
      hasRestriction: false,
      hasActiveTDV: false,
      proximaAcao: 'nova_tdv'
    })
  })
})
