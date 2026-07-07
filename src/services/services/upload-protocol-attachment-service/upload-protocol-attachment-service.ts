import type { ServiceNowCsmClient } from '../../../clients'
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

  async run (input: UploadProtocolAttachmentInput): Promise<UploadProtocolAttachmentResponse> {
    try {
      if (!input.sysId.trim()) {
        throw new BadRequest('sys_id é obrigatório para enviar o anexo')
      }

      if (!input.comment.trim()) {
        throw new BadRequest('É necessário informar um comentário para enviar o anexo')
      }

      if (!input.attachment) {
        throw new BadRequest('Nenhum arquivo foi enviado')
      }

      await this.serviceNowCsm.uploadAttachment({
        tableName: 'x_mdpdd_detran_srv_service_case',
        tableSysId: input.sysId,
        fileName: input.attachment.originalName,
        fileBuffer: input.attachment.buffer,
        contentType: input.attachment.mimetype ?? undefined,
      })

      await this.serviceNowCsm.addComment(input.sysId, input.comment)

      return { success: true }
    } catch (error) {
      this.logger.error('Erro ao enviar anexo com comentário para o ServiceNow CSM:')
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
