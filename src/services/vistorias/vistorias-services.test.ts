import { describe, expect, it, vi } from 'vitest'
import createError from 'http-errors'
import type { DetranSpServiceNowVistoriasClient } from '../../clients/detran-sp-service-now-vistorias'
import { DetranSpServiceNowVistoriasError } from '../../clients/detran-sp-service-now-vistorias'
import { CriaQRCodeVistoriaService } from './cria-qr-code-service'
import { BuscaDocumentoVistoriaService } from './busca-documento-service'
import { BuscaDocumentoRestituicaoVistoriaService } from './busca-documento-restituicao-service'
import { GeraAutorizacaoVistoriaService } from './gera-autorizacao-service'
import { ListaPagamentosVistoriaService } from './lista-pagamentos-service'
import { VerificaQRCodeVistoriaService } from './verifica-qr-code-service'
import { VerificaVeiculoVistoriaService } from './verifica-veiculo-service'

const clientAuth = {
  token: 'govbr-access-token',
  cpf: '12345678901'
}

const auth = {
  ...clientAuth,
  renavam: '12345678901',
  placa: 'ABC1D23'
}

function asClient (client: Partial<DetranSpServiceNowVistoriasClient>): DetranSpServiceNowVistoriasClient {
  return client as DetranSpServiceNowVistoriasClient
}

describe('vistorias services', () => {
  it('maps the restitution document to the document viewer contract', async () => {
    const buscaDocumentoRestituicao = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'Evento processado',
        correlationId: 'correlation-id',
        data: { anexo_vistoria: 'restituicao-pdf-base64' }
      }
    })
    const service = new BuscaDocumentoRestituicaoVistoriaService(asClient({ buscaDocumentoRestituicao }))

    await expect(service.run(clientAuth, 'PEV0001157')).resolves.toEqual({
      pdf: 'restituicao-pdf-base64'
    })
    expect(buscaDocumentoRestituicao).toHaveBeenCalledWith(clientAuth, 'PEV0001157')
  })

  it('returns feedback when the restitution document is unavailable', async () => {
    const service = new BuscaDocumentoRestituicaoVistoriaService(asClient({
      buscaDocumentoRestituicao: vi.fn().mockResolvedValue({
        result: {
          success: false,
          message: 'Documento não encontrado'
        }
      })
    }))

    await expect(service.run(clientAuth, 'PEV0001157')).resolves.toEqual({
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível buscar o documento da restituição',
        description: 'Documento não encontrado'
      }
    })
  })

  it('maps the inspection document to the document viewer contract', async () => {
    const buscaDocumentoVistoria = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'Evento processado',
        correlationId: 'correlation-id',
        data: { anexo_vistoria: 'pdf-base64' }
      }
    })
    const service = new BuscaDocumentoVistoriaService(asClient({ buscaDocumentoVistoria }))

    await expect(service.run(clientAuth, 'PEV0001148')).resolves.toEqual({ pdf: 'pdf-base64' })
    expect(buscaDocumentoVistoria).toHaveBeenCalledWith(clientAuth, 'PEV0001148')
  })

  it('returns an empty document when ServiceNow does not find the inspection document', async () => {
    const service = new BuscaDocumentoVistoriaService(asClient({
      buscaDocumentoVistoria: vi.fn().mockResolvedValue({
        result: {
          success: false,
          message: 'Documento não encontrado'
        }
      })
    }))

    await expect(service.run(clientAuth, 'PEV0001148')).resolves.toEqual({
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível buscar o documento de vistoria',
        description: 'Documento não encontrado'
      }
    })
  })

  it('forwards vehicle and process data when verifying the inspection', async () => {
    const body = {
      uuid: 'veh_1',
      veiculo: {
        placa: 'ABC1D23',
        renavam: '12345678901',
        chassi: 'chassi',
        marcaModelo: 'FIAT / PALIO 1.0',
        anoModelo: 2021,
        anoFabricacao: 2020,
        cor: 'Prata',
        categoria: 'Automóvel',
        municipio: 'São Paulo',
        docProprietario: '12345678901',
        uf: 'SP'
      },
      elegibilidade: { podeVistoriar: true, motivo: '' },
      tarifa: {
        id: 'fee-1',
        tipo: 'SEGURANCA',
        valor: 149.37,
        moeda: 'BRL',
        origem: 'DETRAN',
        vigencia: '2026-12-31'
      }
    }
    const verificaVeiculo = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'Veículo encontrado',
        items: [{ number: 'PEV001' }],
        correlationID: 'correlation-id',
        data: { process: 'validar-veiculo-vistoria', body }
      }
    })
    const service = new VerificaVeiculoVistoriaService(asClient({ verificaVeiculo }))

    await expect(service.run({
      ...auth,
      tipoProcesso: 'Outros',
      outroProcesso: 'Transferência de Localidade'
    })).resolves.toEqual({
      vehicle: {
        id: 'veh_1',
        title: 'FIAT / PALIO 1.0',
        plate: 'ABC1D23',
        brandModel: 'FIAT / PALIO 1.0',
        renavam: '12345678901'
      },
      service: {
        name: 'Vistoria de Segurança Veicular',
        description: 'Serviço de Vistoria de Segurança Veicular (conforme Portaria Normativa nº 47 do Detran-SP).',
        amount: '149,37'
      },
      totalDebits: '149,37',
      numeroPEV: 'PEV001',
      correlationId: 'correlation-id'
    })
    expect(verificaVeiculo).toHaveBeenCalledWith(
      clientAuth,
      {
        placa: 'ABC1D23',
        renavam: '12345678901',
        tipo: 'SEGURANCA',
        subtipo: 'SEGURANCA_2'
      }
    )
  })

  it('returns snackbar feedback when no vehicle is found', async () => {
    const service = new VerificaVeiculoVistoriaService(asClient({
      verificaVeiculo: vi.fn().mockResolvedValue(null)
    }))

    await expect(service.run({ ...auth, tipoProcesso: 'Compra e Venda de Veículo' })).resolves.toEqual({
      vehicle: null,
      service: null,
      totalDebits: null,
      numeroPEV: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível verificar o veículo',
        description: 'Tente novamente em alguns instantes.'
      }
    })
  })

  it('returns snackbar feedback when ServiceNow reports that the vehicle is ineligible', async () => {
    const service = new VerificaVeiculoVistoriaService(asClient({
      verificaVeiculo: vi.fn().mockResolvedValue({
        result: {
          success: true,
          message: 'Veículo não encontrado',
          number: 'PEV001',
          correlationID: 'correlation-id',
          data: {
            process: 'validar-veiculo-vistoria',
            body: {
              elegibilidade: { podeVistoriar: false, motivo: 'Veículo não encontrado' }
            }
          }
        }
      })
    }))

    await expect(service.run({ ...auth, tipoProcesso: 'Compra e Venda de Veículo' })).resolves.toEqual({
      vehicle: null,
      service: null,
      totalDebits: null,
      numeroPEV: null,
      correlationId: 'correlation-id',
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível verificar o veículo',
        description: 'Veículo não encontrado'
      }
    })
  })

  it('returns snackbar feedback for a ServiceNow vehicle validation error', async () => {
    const serviceNowError = createError(
      422,
      new DetranSpServiceNowVistoriasError('VeiculoNaoEncontradoError', 'Veículo não encontrado'),
      { expose: true }
    )
    const service = new VerificaVeiculoVistoriaService(asClient({
      verificaVeiculo: vi.fn().mockRejectedValue(serviceNowError)
    }))

    await expect(service.run({ ...auth, tipoProcesso: 'Classificação de Monta' })).resolves.toEqual({
      vehicle: null,
      service: null,
      totalDebits: null,
      numeroPEV: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível verificar o veículo',
        description: 'Veículo não encontrado'
      }
    })
  })

  it('propagates ServiceNow infrastructure errors', async () => {
    const serviceNowError = createError(
      504,
      new DetranSpServiceNowVistoriasError('ServiceUnavailable', 'ServiceNow indisponível'),
      { expose: true }
    )
    const service = new VerificaVeiculoVistoriaService(asClient({
      verificaVeiculo: vi.fn().mockRejectedValue(serviceNowError)
    }))

    await expect(service.run({ ...auth, tipoProcesso: 'Classificação de Monta' })).rejects.toBe(serviceNowError)
  })

  it('maps QR code creation and status to the PIX screen contract', async () => {
    const criaQRCode = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'QRCode gerado com sucesso!',
        correlationID: 'correlation-id',
        pevType: 'Identificação',
        data: {
          process: 'success',
          data: {
            id: 'qr-code-id',
            emv: 'pix-code',
            txid: 'transaction-id',
            qrCodePix: 'data:image/png;base64,qr-code',
            valorTotal: 9,
            expiracao: 900,
            dtExpiracao: '2026-07-24 18:00:00'
          }
        }
      }
    })
    const client = asClient({
      criaQRCode,
      verificaQRCode: vi.fn().mockResolvedValue({
        result: {
          success: true,
          message: 'Status retornado',
          data: {
            process: 'status-qr-code',
            body: {
              id: 'qr-code-id',
              status: 'LIQUIDADO'
            }
          },
          correlationID: null
        }
      })
    })

    await expect(new CriaQRCodeVistoriaService(client).run(clientAuth, 'correlation-id')).resolves.toEqual({
      idSolServico: 'qr-code-id',
      qrCode: 'pix-code',
      expiresAt: '2026-07-24 18:00:00'
    })
    expect(criaQRCode).toHaveBeenCalledWith(clientAuth, { correlationID: 'correlation-id' })
    await expect(new VerificaQRCodeVistoriaService(client).run(clientAuth, 'qr-code-id')).resolves.toEqual({
      estado: 2,
      comprovante: 'qr-code-id',
      confirmedDate: expect.any(String)
    })
    expect(client.verificaQRCode).toHaveBeenCalledWith(clientAuth, 'qr-code-id')
  })

  it('maps the generated authorization document to the frontend contract', async () => {
    const geraDocumento = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'Documento gerado',
        file_name: 'autorizacao.pdf',
        content_type: 'application/pdf',
        base64: 'pdf-base64',
        attachment_id: 'attachment-id'
      }
    })
    const service = new GeraAutorizacaoVistoriaService(asClient({ geraDocumento }))

    await expect(service.run({
      ...clientAuth,
      numeroPEV: 'PEV0001136',
      documento: 'b18b59d4-c599-4424-bf7a-ad90c57696e8'
    })).resolves.toEqual({ pdf: 'pdf-base64' })
    expect(geraDocumento).toHaveBeenCalledWith(
      clientAuth,
      {
        numeroPEV: 'PEV0001136',
        documento: 'b18b59d4-c599-4424-bf7a-ad90c57696e8'
      }
    )
  })

  it('returns snackbar feedback when the authorization document is not generated', async () => {
    const service = new GeraAutorizacaoVistoriaService(asClient({
      geraDocumento: vi.fn().mockResolvedValue({
        result: {
          success: false,
          message: 'Documento não encontrado'
        }
      })
    }))

    await expect(service.run({
      ...clientAuth,
      numeroPEV: 'PEV0001136',
      documento: 'b18b59d4-c599-4424-bf7a-ad90c57696e8'
    })).resolves.toEqual({
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível gerar a autorização',
        description: 'Documento não encontrado'
      }
    })
  })

  it('returns only the first 100 payments with a PEV number', async () => {
    const payments = Array.from({ length: 102 }, (_, index) => ({
      id: `payment-${index}`,
      placa: 'ABC1D23',
      token: `token-${index}`,
      status: 'ATIVO',
      modeloAuto: 'FIAT/PALIO',
      paymentDate: '2026-07-30T21:01:14.047Z',
      tipo: 'IDENTIFICACAO',
      subtipoDescricao: 'Preparação para leilão',
      pagador: { nome: 'Pagador', documento: '12345678901' },
      pevNumber: index === 0 ? '' : index === 1 ? '   ' : `PEV${index}`,
      correlationId: `correlation-${index}`
    }))
    const listaPagamentos = vi.fn().mockResolvedValue({
      result: {
        success: true,
        message: 'Evento processado',
        items: payments,
        total: payments.length,
        page: 1,
        pageSize: 100,
        totalPages: 2
      }
    })
    const service = new ListaPagamentosVistoriaService(asClient({ listaPagamentos }))

    const result = await service.run(clientAuth, '12345678901', false)

    if (!Array.isArray(result)) {
      throw new Error('Expected a payment list')
    }

    expect(result).toHaveLength(100)
    expect(result[0]).toMatchObject({
      pevNumber: 'PEV2',
      plate: 'ABC1D23',
      brandModel: 'FIAT/PALIO',
      vistoriaToken: 'token-2',
      vistoriaPaymentDate: '30/07/2026 18:01',
      vistoriaSubtypeDescription: 'Preparação para leilão',
      vistoriaStatus: 'ATIVO'
    })
    expect(result[0]).not.toHaveProperty('placa')
    expect(result[0]).not.toHaveProperty('modeloAuto')
    expect(result[0]).not.toHaveProperty('token')
    expect(result[0]).not.toHaveProperty('status')
    expect(result[0]).not.toHaveProperty('paymentDate')
    expect(result[0]).not.toHaveProperty('subtipoDescricao')
    expect(listaPagamentos).toHaveBeenCalledWith(clientAuth, '12345678901', false)
  })

})
