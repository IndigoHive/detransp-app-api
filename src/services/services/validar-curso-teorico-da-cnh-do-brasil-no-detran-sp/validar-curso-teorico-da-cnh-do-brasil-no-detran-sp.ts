import type { ServiceNowCsmClient } from '../../../clients'
import type { Logger } from 'pino'
import type {
  ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpInput,
  ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpResponse,
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

export class ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (input: ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpInput): Promise<ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpResponse> {
    try {
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

  private mapInputToServiceNowPayload (input: ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpInput) {
    return {
      variables: {
        requester_cpf: input.cpfOuCnpj.replace(/\D/g, '').length === 11 ? input.cpfOuCnpj : '',
        solicito_a_alteracao_da_s__seguintes_informacoes_em_meu_prontuario_de_habilitacao: '1',
        representation: input.representation ? 'true' : 'false',
        polopassivo: 'nao_reu',
        municipio: input.municipio,
        requester_email: input.email,
        solicito_a_parametrizacao__aumento_ou_alteracao_de_vagas_para_a_banca_em_questao__conforme_justifica: '1',
        ja_realizei_a_etapa_de__iniciar_processo_de_primeira_habilitacao__junto_ao_portal_do_detran_sp: input.jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP ? 'true' : 'false',
        ja_conclui_a_etapa_de__curso_teorico__e_expedicao_do_certificado: input.jaConcluiEtapaCursoTeoricoExpedicaoCertificado ? 'true' : 'false',
        csm: 'true',
        cidadao_com_amputacao: '1',
        localidade___exclusivo_para_agendamentos_da_capital_: '0',
        documents: 'true',
        fields: 'true',
        ja_realizei_exame_de_aptidao_fisica_e_mental__exame_medico__e_avaliacao_psicologica: input.jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica ? 'true' : 'false',
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
        'IO:b82641dd47f9cf501405ae88036d43d6': "true",
        requester: 'true',
        deployed_item: '0a6d000147f53a9006482a54f26d431b',
        cadastro_descadastro: 'Cadastro',
        categoria_de_titular: 'Cidadão',
        motivo_da_exclusao_curso: '1',
        selecionar_o_servico_: '1',
        statements: 'true',
        doc_comprovacao_representacao: input.documentoComprovanteRepresentacao ? 'true' : 'false',
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
