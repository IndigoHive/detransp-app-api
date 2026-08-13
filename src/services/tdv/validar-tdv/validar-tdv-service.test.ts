import createError from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { ValidarTdvService } from './validar-tdv-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

const baseInput = {
  codigoTransferenciaVeiculo: 'TDV-CARTORIO-1',
  placaVeiculo: 'GHI8J90',
  codigoRenavamVeiculo: '00010020031',
  origem: CodigoOrigemTDV.CARTORIO,
  estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  nomeVendedor: 'João Vendedor',
  codigoVendedor: '11122233344'
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ValidarTdvService', () => {
  it('returns enotariado when ServiceNow validates the transfer', async () => {
    const validarTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({ validarTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({ proximaAcao: 'enotariado' })
    expect(validarTdv).toHaveBeenCalledWith(clientAuth, {
      codigoTransferenciaVeiculo: 'TDV-CARTORIO-1',
      placaVeiculo: 'GHI8J90',
      codigoRenavamVeiculo: '00010020031',
      origem: CodigoOrigemTDV.CARTORIO,
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
      nomeVendedor: 'João Vendedor',
      codigoVendedor: '11122233344'
    })
  })

  it('accepts listing aliases for codigo and renavam', async () => {
    const validarTdv = vi.fn().mockResolvedValue(undefined)
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({ validarTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-CARTORIO-1',
      placaVeiculo: 'GHI8J90',
      renavamVeiculo: '00010020031',
      origem: CodigoOrigemTDV.CARTORIO,
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })).resolves.toEqual({ proximaAcao: 'enotariado' })
    expect(validarTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      codigoTransferenciaVeiculo: 'TDV-CARTORIO-1',
      codigoRenavamVeiculo: '00010020031'
    }))
    const payload = validarTdv.mock.calls[0]?.[1] as Record<string, unknown> | undefined
    expect(payload).not.toHaveProperty('codigoTransferencia')
    expect(payload).not.toHaveProperty('renavamVeiculo')
  })

  it('maps DuasAssinaturasError to duas_assinaturas', async () => {
    const error = createError(
      406,
      new DetranSpServiceNowError('DuasAssinaturasError', 'Assinatura não localizada'),
      { expose: true }
    )
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({
        validarTdv: vi.fn().mockRejectedValue(error)
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'duas_assinaturas'
    })
  })

  it('maps DuasPessoasFisicasError to duas_pessoas_fisicas', async () => {
    const error = createError(
      406,
      new DetranSpServiceNowError('DuasPessoasFisicasError', 'Uma das partes é pessoa jurídica'),
      { expose: true }
    )
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({
        validarTdv: vi.fn().mockRejectedValue(error)
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'duas_pessoas_fisicas'
    })
  })

  it('rethrows unknown ServiceNow errors', async () => {
    const error = createError(
      500,
      new DetranSpServiceNowError('SomeUnknownError', 'falha inesperada'),
      { expose: true }
    )
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({
        validarTdv: vi.fn().mockRejectedValue(error)
      })
    })

    await expect(service.run(authHeader, baseInput)).rejects.toBe(error)
  })

  it('rejects missing required fields', async () => {
    const service = new ValidarTdvService({
      detranSpServiceNowTdv: asClient({})
    })

    await expect(service.run(authHeader, {
      placaVeiculo: 'GHI8J90',
      origem: CodigoOrigemTDV.CARTORIO
    })).rejects.toMatchObject({
      status: 400,
      message: 'codigoTransferenciaVeiculo, placaVeiculo, codigoRenavamVeiculo, origem e estado são obrigatórios'
    })
  })
})
