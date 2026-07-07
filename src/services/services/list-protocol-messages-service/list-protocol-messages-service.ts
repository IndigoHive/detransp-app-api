import type { GetProtocolMessagesResult, ServiceNowCsmClient } from '../../../clients'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

export class ListProtocolMessagesService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (protocolId: string): Promise<GetProtocolMessagesResult> {
    if (!protocolId.trim()) {
      const error = new Error('sys_id é obrigatório para listar as mensagens do protocolo')
      ;(error as Error & { status?: number }).status = 400
      throw error
    }

    return await this.serviceNowCsm.getProtocolMessages(protocolId)
  }
}
