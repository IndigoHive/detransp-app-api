import type { Logger } from 'pino'
import type { Config } from '../../../types'
import { DetranSpServiceNowHttp } from '../detran-sp-service-now-http'

export type DetranSpServiceNowTdvClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowTdvClient extends DetranSpServiceNowHttp {
  constructor ({ config, logger }: DetranSpServiceNowTdvClientParams) {
    super({
      baseURL: config.serviceNow.tdv.baseUrl,
      logger,
      auth: {
        username: config.serviceNow.tdv.username,
        password: config.serviceNow.tdv.password
      }
    })
  }
}
