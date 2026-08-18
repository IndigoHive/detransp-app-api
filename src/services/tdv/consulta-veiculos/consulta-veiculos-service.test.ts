import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConsultaVeiculosService } from './consulta-veiculos-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ConsultaVeiculosService', () => {
  it('maps owner vehicles including chassi', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue({
      result: [{
        placa: 'BGA8H82',
        placaMercosul: 'true',
        nomeProprietario: 'VENDEDOR TESTE',
        chassi: '9BWZZZ377VT004251',
        codigoRenavam: '1000937230',
        codigoMunicipio: '7107',
        nomeMunicipio: 'SAO PAULO',
        codigoMarca: '11202',
        descricaoMarca: 'HARLEY DAVIDSON/FLSTF',
        anoFabricacao: '2014',
        anoModelo: '2015',
        anoExercicio: '2025',
        dataEmissao: '2022-01-10',
        uf: 'SP'
      }]
    })
    const service = new ConsultaVeiculosService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario })
    })

    await expect(service.run(authorizationHeader)).resolves.toEqual({
      vehicles: [{
        id: '1',
        title: 'HARLEY DAVIDSON/FLSTF',
        plate: 'BGA8H82',
        licensingStatus: 'REGULAR',
        licensingExpirationDate: '31/12/2025',
        type: 'Passeio',
        brandModel: 'HARLEY DAVIDSON/FLSTF',
        renavam: '1000937230',
        chassi: '9BWZZZ377VT004251',
        lastLicensing: '2022-01-10',
        yearFab: '2014',
        yearMod: '2015'
      }]
    })
  })

  it('returns an empty list when ServiceNow has no vehicles', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue(undefined)
    const service = new ConsultaVeiculosService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario })
    })

    await expect(service.run(authorizationHeader)).resolves.toEqual({ vehicles: [] })
  })
})
