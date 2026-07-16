import { BadRequest, NotFound } from 'http-errors'
import type { ArquivoPecaRaw, PecaRaw, RotaCrvPecasClient } from '../../../clients/rota-crv-pecas'
import type { RotaVistoriasClient } from '../../../clients/rota-vistorias'
import { extractNumeroFromQrUrl } from '../utils'
import type { ConsultaPecaResult } from '../types'

export class ConsultaPecaService {
  private readonly rotaCrvPecasClient: RotaCrvPecasClient
  private readonly rotaVistoriasClient: RotaVistoriasClient

  constructor(rotaCrvPecasClient: RotaCrvPecasClient, rotaVistoriasClient: RotaVistoriasClient) {
    this.rotaCrvPecasClient = rotaCrvPecasClient
    this.rotaVistoriasClient = rotaVistoriasClient
  }

  async run(accessToken: string, numero: string): Promise<ConsultaPecaResult> {
    if (!numero?.trim()) throw BadRequest('Número da etiqueta é obrigatório.')

    // Chamada principal — não é best-effort, qualquer erro (incl. 404 do
    // interceptor) propaga direto, sem try/catch (padrão do projeto).
    const { peca: pecas } = await this.rotaCrvPecasClient.buscaPeca(accessToken, numero)
    const peca = pecas?.[0]
    if (!peca) throw NotFound('Peça não encontrada.')

    const needsMotor = peca.tipoPeca?.trim().toLowerCase() === 'bloco do motor'

    // Best-effort, não bloqueante — mesmo padrão de
    // consulta-veiculo-debitos-service: o resultado principal aparece mesmo
    // que imagens ou a busca de motor falhem, só sem essa parte.
    const [imagensSettled, motorSettled] = await Promise.allSettled([
      this.rotaCrvPecasClient.buscaArquivos(accessToken, numero),
      needsMotor && peca.chassi
        ? this.rotaVistoriasClient.buscaVeiculoPorChassi(accessToken, peca.chassi)
        : Promise.resolve(null),
    ])

    const imagens = imagensSettled.status === 'fulfilled' ? imagensSettled.value.resultado : []
    const numeroMotor =
      motorSettled.status === 'fulfilled' ? motorSettled.value?.[0]?.numeroMotor ?? null : null

    return this.buildResult(peca, imagens, numeroMotor)
  }

  async runFromQrCode(accessToken: string, scannedUrl: string): Promise<ConsultaPecaResult> {
    const numero = extractNumeroFromQrUrl(scannedUrl)
    return this.run(accessToken, numero)
  }

  private buildResult(
    peca: PecaRaw,
    imagens: ArquivoPecaRaw[],
    numeroMotor: string | null,
  ): ConsultaPecaResult {
    return {
      empresa: peca.nomeEmpresa
        ? {
            cnpj: peca.cnpj,
            razaoSocial: peca.nomeEmpresa,
            telefone: peca.telefoneDDD && peca.telefoneNumero ? `(${peca.telefoneDDD}) ${peca.telefoneNumero}` : null,
            email: peca.email,
            endereco: this.buildEndereco(peca),
          }
        : null,
      peca: {
        numeroIdentificacao: peca.numeroPeca,
        tipo: peca.tipoPeca,
        numeroMotor,
        classificacao: peca.classificacao,
      },
      veiculo: {
        placa: peca.placa,
        chassi: peca.chassi,
        renavam: peca.renavam,
        marcaModelo: peca.modelo,
        cor: peca.cor,
        anoFabricacao: peca.anoFabricacao,
        anoModelo: peca.anoModelo,
        combustivel: peca.combustivel,
      },
      imagens: imagens.map((imagem) => ({
        url: imagem.url,
        descricao: imagem.descricao,
        sequencia: imagem.sequencia,
      })),
    }
  }

  private buildEndereco(peca: PecaRaw): string | null {
    const linha = [peca.logradouro, peca.numero, peca.complemento].filter(Boolean).join(', ')
    const cidadeEstado = [peca.cidade, peca.estado].filter(Boolean).join(' - ')
    const partes = [linha, peca.bairro, cidadeEstado, peca.cep].filter(Boolean)
    return partes.length > 0 ? partes.join(', ') : null
  }
}
