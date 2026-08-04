import type { ProtocolMessage, ServiceNowCsmClient } from '../../../clients'

const APPMOBILE_SYS_CREATED_BY = 'int.appmobile'
const APPMOBILE_AUTHOR_LABEL = 'Aplicativo Detran-SP'
const DETRAN_AUTHOR_LABEL = 'Detran-SP'
const FALLBACK_USER_LABEL = 'Usuário'

function isCpf (value: string): boolean {
  return value.replace(/\D/g, '').length === 11
}

function resolveAuthor (sysCreatedBy: string, userName?: string): { author: string, author_is_user: boolean } {
  if (sysCreatedBy.trim() === APPMOBILE_SYS_CREATED_BY) {
    return { author: APPMOBILE_AUTHOR_LABEL, author_is_user: false }
  }
  if (isCpf(sysCreatedBy)) {
    return { author: userName ?? FALLBACK_USER_LABEL, author_is_user: true }
  }
  return { author: DETRAN_AUTHOR_LABEL, author_is_user: false }
}

export type ProtocolMessageResult = ProtocolMessage & {
  author: string
  author_is_user: boolean
}

export type ListProtocolMessagesResult = {
  result: ProtocolMessageResult[]
}

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

export class ListProtocolMessagesService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (protocolId: string, userName?: string): Promise<ListProtocolMessagesResult> {
    if (!protocolId.trim()) {
      const error = new Error('sys_id é obrigatório para listar as mensagens do protocolo')
      ;(error as Error & { status?: number }).status = 400
      throw error
    }

    const { result } = await this.serviceNowCsm.getProtocolMessages(protocolId)

    return {
      result: result.map((item) => ({ ...item, ...resolveAuthor(item.sys_created_by, userName) })),
    }
  }
}
