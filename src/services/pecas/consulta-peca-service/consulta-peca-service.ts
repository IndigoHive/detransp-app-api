import { BadRequest, isHttpError } from 'http-errors'
import type { ArquivoPecaRaw, PecaRaw, RotaCrvPecasClient } from '../../../clients/rota-crv-pecas'
import type { RotaVistoriasClient } from '../../../clients/rota-vistorias'
import { ensureSpPrefix, extractNumeroFromQrUrl } from '../utils'
import type { ConsultaPecaResult } from '../types'
import type { IAnalyticsService } from '../../analytics'

// Fotos do veículo às vezes chegam do upstream embrulhadas em PDF em vez de
// imagem direta — descartadas do carrossel de imagens (aparecem em
// `documentos` em vez de `imagens`).
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg'])

// Status já classificados e mensageados pelo interceptor do rota-crv-pecas-client. Convertidos
// aqui em resposta 200 com `isError`, pois esse endpoint alimenta o roteamento de um flow gráfico
// (if_node/case_node), que só ramifica sobre corpo de resposta 200 — qualquer outro status
// (ex.: 401 do upstream) continua propagando normalmente para os middlewares globais.
const ERROR_STATUS_CODES = [403, 500, 400, 404]

type ArquivoComBinario = ArquivoPecaRaw & { binario: string }

export class ConsultaPecaService {
  private readonly rotaCrvPecasClient: RotaCrvPecasClient
  private readonly rotaVistoriasClient: RotaVistoriasClient
  private readonly analyticsService: IAnalyticsService

  constructor(rotaCrvPecasClient: RotaCrvPecasClient, rotaVistoriasClient: RotaVistoriasClient, analyticsService: IAnalyticsService) {
    this.rotaCrvPecasClient = rotaCrvPecasClient
    this.rotaVistoriasClient = rotaVistoriasClient
    this.analyticsService = analyticsService
  }

  async run(accessToken: string, numero: string, cpf?: string | null): Promise<ConsultaPecaResult | undefined> {
    if (!numero?.trim()) throw BadRequest('Número da etiqueta é obrigatório.')
    numero = ensureSpPrefix(numero.trim())

    // Chamada principal — não é best-effort. Erros nos 4 status já tratados pelo interceptor do
    // client (403/500/400/404) são normalizados em `isError` (ver ERROR_STATUS_CODES acima);
    // qualquer outro erro propaga direto, sem try/catch (padrão do projeto).
    let pecas: PecaRaw[]
    try {
      ;({ peca: pecas } = await this.rotaCrvPecasClient.buscaPeca(accessToken, numero))
    } catch (err) {
      if (isHttpError(err) && ERROR_STATUS_CODES.includes(err.status)) {
        return { isError: true, errorCode: err.status, message: err.message }
      }
      throw err
    }

    const peca = pecas?.[0]
    if (!peca) return

    // Só aqui: o early return acima é "peça não encontrada", não "a pessoa viu o resultado".
    // Sem $insert_id — não é endpoint polado, e uma segunda consulta real (outra etiqueta,
    // retry do usuário) é sinal legítimo, não ruído.
    this.analyticsService.capture(cpf, 'pecas:peca_query')

    const needsMotor = peca.tipoPeca?.trim().toLowerCase() === 'bloco do motor'

    // Best-effort, não bloqueante — mesmo padrão de
    // consulta-veiculo-debitos-service: o resultado principal aparece mesmo
    // que arquivos ou a busca de motor falhem, só sem essa parte.
    const [arquivosSettled, motorSettled] = await Promise.allSettled([
      this.rotaCrvPecasClient.buscaArquivos(accessToken, numero),
      needsMotor && peca.chassi
        ? this.rotaVistoriasClient.buscaVeiculoPorChassi(accessToken, peca.chassi)
        : Promise.resolve(null),
    ])

    const arquivos = arquivosSettled.status === 'fulfilled' ? arquivosSettled.value.resultado : []
    const numeroMotor =
      motorSettled.status === 'fulfilled' ? motorSettled.value?.[0]?.numeroMotor ?? null : null

    // Cada URL de arquivo é autenticada com o token real do Detran, que o app
    // nunca possui — baixamos o conteúdo aqui, uma única vez, e embutimos como
    // base64 na resposta. Best-effort por arquivo: se um download falhar, ele
    // simplesmente não aparece.
    const arquivosComBinario = await this.baixaArquivos(accessToken, arquivos)

    return this.buildResult(peca, arquivosComBinario, numeroMotor)
  }

  async runFromQrCode(accessToken: string, scannedUrl: string, cpf?: string | null): Promise<ConsultaPecaResult | undefined> {
    const numero = extractNumeroFromQrUrl(scannedUrl)
    return this.run(accessToken, numero, cpf)
  }

  private async baixaArquivos(accessToken: string, arquivos: ArquivoPecaRaw[]): Promise<ArquivoComBinario[]> {
    const settled = await Promise.allSettled(
      arquivos.map(async (arquivo) => ({
        ...arquivo,
        binario: (await this.rotaCrvPecasClient.baixaArquivoBinario(accessToken, arquivo.url)).data.toString('base64'),
      })),
    )

    return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  }

  private buildResult(peca: PecaRaw, arquivos: ArquivoComBinario[], numeroMotor: string | null): ConsultaPecaResult {
    const imagens = arquivos
      .filter((arquivo) => IMAGE_EXTENSIONS.has(arquivo.extensao?.toLowerCase()))
      .map((arquivo) => this.toArquivoItem(arquivo))
    const documentos = arquivos
      .filter((arquivo) => !IMAGE_EXTENSIONS.has(arquivo.extensao?.toLowerCase()))
      .map((arquivo) => this.toArquivoItem(arquivo))

    return {
      isError: false,
      empresa: peca.nomeEmpresa
        ? {
            cnpj: peca.cnpj,
            razaoSocial: peca.nomeEmpresa,
            telefone: peca.telefoneDDD && peca.telefoneNumero ? `(${peca.telefoneDDD}) ${peca.telefoneNumero}` : null,
            email: peca.email ? peca.email.toLowerCase() : null,
            endereco: this.buildEndereco(peca),
          }
        : null,
      peca: {
        numeroIdentificacao: peca.numeroPeca,
        tipo: peca.tipoPeca,
        numeroMotor,
        classificacao: this.capitalizeWords(peca.classificacao || ''),
      },
      veiculo: {
        placa: peca.placa,
        chassi: peca.chassi,
        renavam: peca.renavam,
        marcaModelo: peca.modelo,
        cor: this.capitalizeWords(peca.cor || ''),
        anoFabricacao: peca.anoFabricacao,
        anoModelo: peca.anoModelo,
        combustivel: this.capitalizeWords(peca.combustivel || ''),
      },
      imagens,
      documentos,
      isEmpty: imagens.length === 0 && documentos.length === 0,
    }
  }

  private toArquivoItem(arquivo: ArquivoComBinario) {
    return {
      descricao: arquivo.descricao,
      sequencia: arquivo.sequencia,
      codigo: arquivo.codigo,
      extensao: arquivo.extensao,
      binario: arquivo.binario,
    }
  }

  private buildEndereco(peca: PecaRaw): string | null {
    const linha = [peca.logradouro, peca.numero, peca.complemento].filter(Boolean).join(', ')
    const cidadeEstado = [peca.cidade, peca.estado].filter(Boolean).join(' - ')
    const partes = [linha, peca.bairro, cidadeEstado, peca.cep].filter(Boolean)
    return partes.length > 0 ? partes.join(', ') : null
  }

  private capitalizeWords(text: string): string {
    return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  }
}
