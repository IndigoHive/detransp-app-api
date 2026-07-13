import type { Logger } from 'pino'
import type { DetranSpServiceNowPgtoClient } from '../../../clients/detran-sp-service-now-pgto'
import type { DebRestrAuth } from '../types'

// tipos-servico ids are ServiceNow sys_ids: stable per environment but different
// across environments, so they must be resolved at runtime by codigo_sefaz.
const CACHE_TTL_MS = 60 * 60 * 1000

type TiposServicoCache = {
  expiresAt: number
  byCodigoSefaz: Map<string, string>
}

// Module-level cache: container services are request-scoped, the tipos-servico
// table is global and rarely changes.
let cache: TiposServicoCache | null = null

export class TiposServicoResolverService {
  private readonly client: DetranSpServiceNowPgtoClient
  private readonly logger: Logger

  constructor (client: DetranSpServiceNowPgtoClient, logger: Logger) {
    this.client = client
    this.logger = logger
  }

  async resolve (auth: DebRestrAuth, codigoSefaz: string): Promise<string | null> {
    const now = Date.now()

    if (!cache || cache.expiresAt <= now) {
      const result = await this.client.listaTiposServico(auth)
      const byCodigoSefaz = new Map<string, string>()

      for (const tipo of result?.data ?? []) {
        // ServiceNow has already shipped both attribute shapes — accept either
        const codigo = tipo.attributes?.codigo_sefaz ?? tipo.attributes?.codigoservico
        if (codigo && tipo.id) byCodigoSefaz.set(codigo, tipo.id)
      }

      // Don't cache a broken payload (attributes came back null once before)
      if (byCodigoSefaz.size === 0) {
        this.logger.error(
          { service: 'tipos-servico-resolver', itemCount: result?.data?.length ?? 0 },
          '🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 TIPOS_SERVICO_CATALOG_BROKEN — SERVICENOW GET /tipos-servico RETURNED NO USABLE CODES (codigo_sefaz/codigoservico ALL NULL). THE KNOWN REGRESSION IS BACK. ALL DEBT PIX PAYMENTS ARE BLOCKED UNTIL THE BACKEND FIXES THE CATALOG. 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴'
        )
        return null
      }

      cache = { expiresAt: now + CACHE_TTL_MS, byCodigoSefaz }
    }

    const resolved = cache.byCodigoSefaz.get(codigoSefaz) ?? null
    if (!resolved) {
      this.logger.error(
        { service: 'tipos-servico-resolver', codigoSefaz, knownCodes: [...cache.byCodigoSefaz.keys()] },
        `🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 TIPOS_SERVICO_CODE_MISSING — codigo_sefaz "${codigoSefaz}" NOT FOUND IN THE SERVICENOW CATALOG. PIX FOR THIS SERVICE TYPE CANNOT BE CREATED. 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴`
      )
    }
    return resolved
  }
}
