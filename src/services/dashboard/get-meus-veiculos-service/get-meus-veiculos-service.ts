import type { Logger } from 'pino'
import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetMeusVeiculosService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient, private logger: Logger) {}

  async run(accessToken: string, cpf: string): Promise<unknown> {
    const [meusVeiculosSettled, dadosCondutorSettled] = await Promise.allSettled([
      this.dashboardClient.get('meusVeiculos', accessToken, cpf),
      this.dashboardClient.get('dados-condutor', accessToken, cpf, { payload: '' }),
    ])

    // TEMP DEBUG — remove after this session. Comparing meusVeiculos vs
    // dados-condutor raw payloads to check whether the latter can replace
    // the former (ServiceNow dev claim). App response is unaffected.
    this.logger.warn(
      {
        action: 'temp-debug-meus-veiculos-vs-dados-condutor',
        meusVeiculos: meusVeiculosSettled.status === 'fulfilled'
          ? meusVeiculosSettled.value
          : { error: String(meusVeiculosSettled.reason) },
        dadosCondutor: dadosCondutorSettled.status === 'fulfilled'
          ? dadosCondutorSettled.value
          : { error: String(dadosCondutorSettled.reason) },
      },
      'TEMP DEBUG meusVeiculos vs dados-condutor raw response',
    )

    if (meusVeiculosSettled.status === 'rejected') throw meusVeiculosSettled.reason
    return meusVeiculosSettled.value
  }
}
