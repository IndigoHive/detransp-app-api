import type { ServiceNowCsmClient } from '../../../clients'
import type { Logger } from 'pino'
import type {
  LiberarMatriculaDaAutoescolaInput,
  LiberarMatriculaDaAutoescolaResponse,
} from './types'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
  logger: Logger
}

type ServiceNowCsmSubmitResult = {
  result: {
    number?: string
    sys_id?: string
    [key: string]: unknown
  }
}

type NormalizedInput = {
  nome: string
  cpfOuCnpj: string
  telefone: string
  email: string
  estado: string
  municipio: string
  reciclagem: boolean
  declaracao_responsabilidade_pela_solicitacao: boolean
  declaracao_responsabilidade_art_299: boolean
  documentoComprovanteRepresentacao?: boolean
  representation: boolean
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

function toBoolean (value: unknown): boolean {
  return value === true || value === 'true'
}

function toText (value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export class liberarMatriculaDaAutoescolaService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (rawInput: LiberarMatriculaDaAutoescolaInput): Promise<LiberarMatriculaDaAutoescolaResponse> {
    try {
      const input = this.normalizeInput(rawInput)
      const payload = this.mapInputToServiceNowPayload(input)

      const result = await this.serviceNowCsm.submitProducer<ServiceNowCsmSubmitResult>(
        '9ffe1f1c874b121422bdc9530cbb3570',
        payload
      )

      const protocol = result.result?.number
      const recordSysId = result.result?.sys_id

      if (recordSysId && input.attachment) {
        await this.serviceNowCsm.uploadAttachment({
          tableName: 'x_mdpdd_detran_srv_service_case',
          tableSysId: recordSysId,
          fileName: input.attachment.originalName,
          fileBuffer: input.attachment.buffer,
          contentType: input.attachment.mimetype ?? undefined,
        })
      }

      return {
        protocol: protocol ?? recordSysId ?? 'Protocolo não disponível',
      }
    } catch (error) {
      this.logger.error('Erro ao enviar payload para o ServiceNow CSM:')
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Não foi possível enviar',
          description: this.getErrorDescription(error)
        },
      }
    }
  }

  private normalizeInput (input: LiberarMatriculaDaAutoescolaInput): NormalizedInput {
    return {
      nome: toText(input.nome),
      cpfOuCnpj: toText(input.cpfOuCnpj),
      telefone: toText(input.telefone),
      email: toText(input.email),
      municipio: toText(input.municipio),
      estado: toText(input.estado),
      declaracao_responsabilidade_pela_solicitacao: toBoolean(input.declaracao_responsabilidade_pela_solicitacao),
      declaracao_responsabilidade_art_299: toBoolean(input.declaracao_responsabilidade_art_299),
      reciclagem: toBoolean(input.reciclagem),
      ...(input.documentoComprovanteRepresentacao === undefined ? {} : { documentoComprovanteRepresentacao: toBoolean(input.documentoComprovanteRepresentacao) }),
      representation: toBoolean(input.representation),
      ...(input.attachment ? { attachment: input.attachment } : {}),
    }
  }

  private mapInputToServiceNowPayload (input: NormalizedInput) {
    return {
      variables: {
        requester_cpf: input.cpfOuCnpj.replace(/\D/g, '').length === 11 ? input.cpfOuCnpj : '',
        solicito_a_alteracao_da_s__seguintes_informacoes_em_meu_prontuario_de_habilitacao: '1',
        representation: 'true',
        polopassivo: 'nao_reu',
        requester_email: input.email,
        csm: 'true',
        cidadao_com_amputacao: '1',
        localidade___exclusivo_para_agendamentos_da_capital_: '0',
        documents: 'true',
        fields: 'true',
        solicito_a_parametrizacao__aumento_ou_alteracao_de_vagas_para_a_banca_em_questao__conforme_justifica: '1',
        penalidades: 'crime_desobediencia',
        desbloqueio_reset_de_senha: 'Desbloqueio',
        solicitacao: '1',
        sold_product: '50268eb087a7521022bdc9530cbb3561',
        justificativas_para_redirecionamento: '1',
        resultado_do_exame_: 'A) Apto',
        requester_phone: input.telefone,
        retorno_para_categoria: '1',
        contact_type: 'cidadao',
        requester_proof_of_representation: input.representation ? 'true' : 'false',
        requester_name: input.nome,
        'IO:21e5c7cefb0ac310a6adf2d27eefdcba': "true",
        requester: 'true',
        deployed_item: '9e42d06097266250bc73b067f053af5e',
        cadastro_descadastro: 'Cadastro',
        categoria_de_titular: 'Cidadão',
        motivo_da_exclusao_curso: '1',
        selecionar_o_servico_: '1',
        statements: 'true',
        endereco_cidade: input.municipio,
        estado: input.estado,
        declaracao_responsabilidade_pela_solicitacao: input.declaracao_responsabilidade_pela_solicitacao ? 'true' : 'false',
        declaracao_responsabilidade_art_299: input.declaracao_responsabilidade_art_299 ? 'true' : 'false',
        reciclagem: input.reciclagem ? 'true' : 'false',
        declaracoes: 'true',
      },
      get_portal_messages: 'true',
      sysparm_no_validation: 'true',
      engagement_channel: 'sp',
      referrer: null,
    }
  }

  private getErrorDescription (error: unknown): string {
    if (error instanceof Error) {
      const axiosError = error as any
      if (axiosError.response?.data?.error?.message) {
        return axiosError.response.data.error.message
      }
      return error.message
    }
    return 'Operação inválida'
  }
}
