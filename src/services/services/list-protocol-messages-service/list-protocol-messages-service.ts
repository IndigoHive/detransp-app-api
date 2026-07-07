import type { ServiceNowCsmClient } from '../../../clients'

export type ListProtocolMessagesResult = {
  result: Record<string, unknown>[]
}

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

export class ListProtocolMessagesService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (protocolId: string): Promise<ListProtocolMessagesResult> {
    if (!protocolId.trim()) {
      const error = new Error('sys_id é obrigatório para listar as mensagens do protocolo')
      ;(error as Error & { status?: number }).status = 400
      throw error
    }

    return await this.serviceNowCsm.getProtocolMessages<ListProtocolMessagesResult>(protocolId)
  }
}
