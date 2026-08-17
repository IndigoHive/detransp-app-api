import type { ServiceNowCsmClient } from '../../../../clients'
import { BadRequest } from 'http-errors'
import type { Logger } from 'pino'
import type {
  UploadProtocolAttachmentInput,
  UploadProtocolAttachmentResponse,
} from './types'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
  logger: Logger
}

export class UploadProtocolAttachmentService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (rawInput: UploadProtocolAttachmentInput): Promise<UploadProtocolAttachmentResponse> {
    try {
      const sysId = typeof rawInput.sys_id === 'string' ? rawInput.sys_id : ''
      const comment = typeof rawInput.comment === 'string' ? rawInput.comment : ''

      if (!sysId.trim()) {
        throw new BadRequest('sys_id é obrigatório para enviar o anexo')
      }

      if (!comment.trim()) {
        throw new BadRequest('É necessário informar um comentário para enviar o anexo')
      }

      const attachments = rawInput.attachments ?? []

      // API de anexos do ServiceNow é um arquivo por request — mesmo tratamento do
      // SubmitCsmProtocolService: loga e segue se um anexo falhar, não aborta o comentário.
      for (const attachment of attachments) {
        try {
          await this.serviceNowCsm.uploadAttachment({
            tableName: 'x_mdpdd_detran_srv_service_case',
            tableSysId: sysId,
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
              sysId,
            },
            'Erro ao enviar anexo para o ServiceNow CSM — comentário será enviado mesmo assim'
          )
        }
      }

      const commentWithAttachment = attachments.length > 0
        ? `${comment}\n\n${attachments.length > 1 ? 'Anexos' : 'Anexo'}: ${attachments.map((a) => a.originalName).join(', ')}`
        : comment

      await this.serviceNowCsm.addComment(sysId, commentWithAttachment)

      return { success: true }
    } catch (error) {
      const axiosError = error as { message?: string; stack?: string; code?: string; response?: { status?: number; data?: unknown } }
      this.logger.error(
        {
          err: { message: axiosError?.message, stack: axiosError?.stack },
          code: axiosError?.code,
          status: axiosError?.response?.status,
          responseData: axiosError?.response?.data,
        },
        'Erro ao enviar anexo com comentário para o ServiceNow CSM'
      )
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Não foi possível enviar o anexo',
          description: this.getErrorDescription(error)
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
