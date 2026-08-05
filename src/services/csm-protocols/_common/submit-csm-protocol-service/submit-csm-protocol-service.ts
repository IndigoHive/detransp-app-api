import type { ServiceNowCsmClient } from '../../../../clients'
import type { Logger } from 'pino'
import type { SubmitCsmProtocolInput, SubmitCsmProtocolResponse } from './types'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
  logger: Logger
}

type ServiceNowCsmSubmitResult = {
  result: {
    number?: string
    sys_id?: string
    redirect_to?: string
    [key: string]: unknown
  }
}

export class SubmitCsmProtocolService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run ({ catalogItemId, payload, attachments }: SubmitCsmProtocolInput): Promise<SubmitCsmProtocolResponse> {
    try {
      // Proxy: o payload é montado inteiro pelo Editor e repassado como veio — sem mapeamento aqui.
      const result = await this.serviceNowCsm.submitProducer<ServiceNowCsmSubmitResult>(catalogItemId, payload)

      const protocol = result.result?.number
      const recordSysId = result.result?.sys_id
      const redirectTo = result.result?.redirect_to

      if (!protocol) {
        this.logger.error({ result: result.result }, 'ServiceNow CSM respondeu sem number — protocolo não foi criado')

        // ServiceNow bloqueia um segundo protocolo aberto do mesmo serviço redirecionando pro
        // registro existente em vez de retornar erro HTTP — sys_id '-1' + esse redirect_to é a assinatura.
        const isDuplicateProtocolBlocked = recordSysId === '-1' && redirectTo === 'generated_record'

        return {
          showSnackbar: {
            variant: 'error',
            title: isDuplicateProtocolBlocked ? 'Solicitação já existe' : 'Não foi possível enviar',
            description: isDuplicateProtocolBlocked
              ? 'Você já possui uma solicitação em andamento para este serviço. Aguarde a finalização para abrir uma nova.'
              : 'Não foi possível confirmar a criação do protocolo. Tente novamente.',
          },
        }
      }

      if (recordSysId && recordSysId !== '-1') {
        // A API de anexos do ServiceNow é um arquivo por request — não há variante em lote.
        for (const attachment of attachments ?? []) {
          try {
            await this.serviceNowCsm.uploadAttachment({
              tableName: 'x_mdpdd_detran_srv_service_case',
              tableSysId: recordSysId,
              fileName: attachment.originalName,
              fileBuffer: attachment.buffer,
              contentType: attachment.mimetype ?? undefined,
            })
          } catch (attachmentError) {
            const axiosError = attachmentError as { message?: string; stack?: string; code?: string; response?: { status?: number; data?: unknown } }
            this.logger.error(
              {
                err: { message: axiosError?.message, stack: axiosError?.stack },
                code: axiosError?.code,
                status: axiosError?.response?.status,
                responseData: axiosError?.response?.data,
                protocol,
              },
              'Erro ao enviar anexo para o ServiceNow CSM — protocolo já criado, anexo não incluído'
            )
          }
        }
      }

      return { protocol }
    } catch (error) {
      const axiosError = error as { message?: string; stack?: string; code?: string; response?: { status?: number; data?: unknown } }
      this.logger.error(
        {
          err: { message: axiosError?.message, stack: axiosError?.stack },
          code: axiosError?.code,
          status: axiosError?.response?.status,
          responseData: axiosError?.response?.data,
        },
        'Erro ao enviar payload para o ServiceNow CSM'
      )
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Não foi possível enviar',
          description: this.getErrorDescription(error),
        },
      }
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
