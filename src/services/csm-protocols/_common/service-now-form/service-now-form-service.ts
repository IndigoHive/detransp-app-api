import type { ServiceNowCsmClient } from '../../../../clients'
import type { Logger } from 'pino'
import type { ServiceNowFormConfig, ServiceNowFormInput, ServiceNowFormResponse } from './types'

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

export const SERVICE_NOW_FORM_PRODUCER_SYS_ID = '9ffe1f1c874b121422bdc9530cbb3570'

const COMMON_VARIABLES: Record<string, string> = {
  solicito_a_alteracao_da_s__seguintes_informacoes_em_meu_prontuario_de_habilitacao: '1',
  representation: 'true',
  polopassivo: 'nao_reu',
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
  retorno_para_categoria: '1',
  contact_type: 'aplicativo_detran',
  requester: 'true',
  cadastro_descadastro: 'Cadastro',
  categoria_de_titular: 'Cidadão',
  motivo_da_exclusao_curso: '1',
  selecionar_o_servico_: '1',
  statements: 'true',
}

export class GenerateServiceNowFormService {
  private readonly config: ServiceNowFormConfig
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor (config: ServiceNowFormConfig, { serviceNowCsm, logger }: Dependencies) {
    this.config = config
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (rawInput: ServiceNowFormInput): Promise<ServiceNowFormResponse> {
    try {
      const payload = this.mapInputToServiceNowPayload(rawInput)

      const result = await this.serviceNowCsm.submitProducer<ServiceNowCsmSubmitResult>(
        this.config.producerSysId,
        payload
      )

      const protocol = result.result?.number
      const recordSysId = result.result?.sys_id

      if (recordSysId) {
        // A API de anexos do ServiceNow é um arquivo por request — não há variante em lote.
        for (const attachment of rawInput.attachments ?? []) {
          await this.serviceNowCsm.uploadAttachment({
            tableName: 'x_mdpdd_detran_srv_service_case',
            tableSysId: recordSysId,
            fileName: attachment.originalName,
            fileBuffer: attachment.buffer,
            contentType: attachment.mimetype ?? undefined,
          })
        }
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
          description: this.getErrorDescription(error),
        },
      }
    }
  }

  private mapInputToServiceNowPayload (input: ServiceNowFormInput) {
    const isTruthy = (val: unknown): boolean => val === true || val === 'true'

    const variables: Record<string, string> = {
      ...COMMON_VARIABLES,
      ...this.config.extraStaticVariables,
      requester_cpf: input.cpfOuCnpj.replace(/\D/g, '').length === 11 ? input.cpfOuCnpj : '',
      requester_email: input.email,
      requester_phone: input.telefone,
      requester_name: input.nome,
      requester_proof_of_representation: isTruthy(input.representation) ? 'true' : 'false',
      deployed_item: this.config.deployedItem,
      [this.config.ioKey]: 'true',
    }

    for (const field of this.config.fields) {
      const value = input[field.key]
      variables[field.variable] = field.type === 'boolean' ? (isTruthy(value) ? 'true' : 'false') : `${value ?? ''}`
    }

    return {
      variables,
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
