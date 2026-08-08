import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
}

export type DebitoItem = {
  descricao: string
  valor: number
  valorFormatado: string
}

export type ConsultaDebitosResult = {
  nomeComprador: string
  debitos: DebitoItem[]
  valorTotal: number
  taxaTransferencia: string
  taxaLicenciamento: string
  totalDebitos: string
}

function formatCurrency (value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export class ConsultaDebitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConsultaDebitosInput): Promise<ConsultaDebitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const [tdvResult, debitosResult] = await Promise.all([
      this.client.buscaTdv(auth, input.codigoTransferencia),
      this.client.buscaDebitosTdv(auth, input.codigoTransferencia)
    ])

    const rawDebitos = debitosResult?.result?.debitos ?? []

    const debitos = rawDebitos.map((d) => ({
      descricao: d.descricao,
      valor: d.valor,
      valorFormatado: formatCurrency(d.valor)
    }))

    const taxaTransferencia = rawDebitos.find(d =>
      d.descricao.toLowerCase().includes('transferência') || d.descricao.toLowerCase().includes('transferencia')
    )?.valor ?? 0

    const taxaLicenciamento = rawDebitos.find(d =>
      d.descricao.toLowerCase().includes('licenciamento')
    )?.valor ?? 0

    const valorTotal = debitosResult?.result?.valorTotal ?? 0

    return {
      nomeComprador: tdvResult?.result?.nomeComprador ?? '',
      debitos,
      valorTotal,
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(valorTotal)
    }
  }
}
