import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { formatDateTimeBr } from '../../deb-restr/utils'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type BuscaPixInput = {
  codigoTransferencia: string
  forcarNovo?: boolean
}

export type BuscaPixResult = {
  qrCode: string
  expiresAt: string
  estado: number
  idPagamento?: string
  dataPagamento?: string
}

function normalizeEstadoQrCode (estado: string | number | undefined | null): number {
  if (estado == null) return 0
  if (typeof estado === 'number' && Number.isFinite(estado)) return estado
  const numeric = Number(estado)
  if (Number.isFinite(numeric)) return numeric
  const lowered = String(estado).toLowerCase()
  if (lowered === 'ativo') return 1
  if (lowered === 'pago') return 2
  if (lowered === 'expirado') return 3
  return 0
}

export class BuscaPixService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: BuscaPixInput): Promise<BuscaPixResult> {
    const codigoTransferencia = input.codigoTransferencia?.trim() ?? ''
    if (!codigoTransferencia) {
      throw BadRequest('codigoTransferencia é obrigatório')
    }

    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const result = await this.client.buscaPixQrCodeTdv(auth, codigoTransferencia, {
      ...(input.forcarNovo !== undefined ? { forcarNovo: input.forcarNovo } : {})
    })

    const data = result?.result
    if (!data?.qrCode) {
      throw new Error('Falha ao obter QR Code PIX')
    }

    const estado = normalizeEstadoQrCode(data.estadoQRCode)
    const idPagamento = data.idPagamentoQRCode?.trim() || undefined
    const rawDataPagamento = data.dataPagamentoQRCode?.trim() || undefined
    const dataPagamento = rawDataPagamento
      ? formatDateTimeBr(rawDataPagamento)
      : estado === 2
        ? formatDateTimeBr(new Date().toISOString())
        : undefined

    return {
      qrCode: data.qrCode,
      expiresAt: data.dataExpiracaoQRCode,
      estado,
      ...(idPagamento ? { idPagamento } : {}),
      ...(dataPagamento ? { dataPagamento } : {})
    }
  }
}
