import {
  ApplicationEnvironment,
  Config,
  TDV_MOCK_PENDENCIAS,
  TDV_MOCK_VALIDAR_TDV,
  TDV_MOCK_VERSOES,
  type TdvMockPendencia,
  type TdvMockValidarTdv,
  type TdvMockVersao
} from '../../types'
import { env } from './env'

const DEFAULT_PORT = 3500
const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com'
const DEFAULT_GOVBR_AUTHORIZE_URL = 'https://sso.acesso.gov.br/authorize'
const DEFAULT_GOVBR_TOKEN_URL = 'https://sso.acesso.gov.br/token'
const DEFAULT_GOVBR_USERINFO_URL = 'https://sso.acesso.gov.br/userinfo'
const GOVBR_SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "govbr_provadevida",
  "api:detran.multas.search",
  "api:detran.vistorias.read",
  "api:detran.veiculos.read",
  "api:sefaz.ipvapix.qrcode.read",
  "api:cdesp.bcadastro.fisica.cpf.search",
  "api:cdesp.bcadastro.juridica.cnpj.search",
  "api:integrador.bcadastro",
  "api:detran.veiculos.search",
  "ip_address",
  "microprofile-jwt",
  "address",
  "api:cnh-pid.search",
  "api:sim-reciclagens.search",
  "govbr_empresa",
  "api:cnh-divisoes-equitativas.search",
  "api:cnh-pid.upsert",
  "api:detran.condutores.search",
  "api:sim-suspensoes.search",
  "api:detran.renach.upsert",
  "api:cnh-mf.upsert",
  "api:cnh-renachs.upsert",
  "api:cnh-mf.search",
  "api:crv-emplacamentos.search",
  "api:cnh-toxicologico.search",
  "api:cnh-cadastros.search",
  "api:sim-suspensoes.upsert",
  "api:sim-indicacoes.upsert",
  "api:crv-emplacamentos.upsert",
  "api:cnh-digital.upsert",
  "api:cnh-renachs.search",
  "api:cnh-digital.search",
  "api:detran.condutores.upsert",
  "api:sim-reciclagens.upsert",
  "api:cnh-divisoes-equitativas.upsert",
  "api:detran.renach.search",
  "api:cnh-toxicologico.upsert",
  "api:cnh-idosos.search",
  "api:crv-cadastros.search",
  "api:sim-recursos.upsert",
  "api:sim-indicacoes.search",
  "api:sim-recursos.search",
  "api:cnh-idosos.upsert",
  "api:crv-cadastros.upsert",
  "phone",
  "api:cnh-cadastros.upsert",
  "api:detran.veiculos.upsert",
  "api:crv-documentos.search",
  "api:crv-documentos.upsert",
  "api:sggd.sousp.cxpostal.user",
  "api:sggd.sousp.cxpostal.admin",
  "api:integrador.vida.update",
  "api:detran-taxas.search",
  "api:vistoria.veiculos.search",
  "api:integrador.appdetran.attestation",
  "api:crv-pecas.search",
  "api:detran-taxas.upsert",
  "api:detran.transferencia.search",
  "api:detran.transferencia.upsert",
  "api:detran.veiculos.extra.judicial.atualizar.agente.garantia.upsert",
  "api:detran.veiculos.extra.judicial.cancelar.busca.apreensao.upsert",
  "api:detran.veiculos.extra.judicial.consulta.tickets.search",
  "api:detran.veiculos.extra.judicial.informar.fotos.upsert",
  "api:detran.veiculos.extra.judicial.informar.recolha.patio.registradora.search",
  "api:detran.veiculos.extra.judicial.informar.recolha.patio.upsert",
  "api:detran.veiculos.extra.judicial.informar.recolha.registradora.upsert",
  "api:detran.veiculos.extra.judicial.iniciar.upsert",
  "api:detran.veiculos.extra.judicial.recebimento.notificacao.upsert",
  "api:detran.veiculos.extra.judicial.recolha.voluntaria.upsert",
  "api:detran.veiculos.extra.judicial.registro.search",
  "api:detran.veiculos.extra.judicial.solicitar.busca.apreensao.upsert",
  "api:detran.veiculos.extra.judicial.status.registro.search",
  "api:detran.veiculos.extra.judicial.veiculos.auto.apreensao.patio.detran.search",
  "api:detran.veiculos.extra.judicial.veiculos.recolhidos.patio.search",
  "api:integrador.jucesp.oab",
  "api:sggd.sp.gov.br.cxpostal.admin",
  "api:sggd.sp.gov.br.cxpostal.user"
]
const dashboardUrl = 'api/x_mdpdd_dashboard/v1/dashboard/'

// Deployment environment of this instance. Kept separate from NODE_ENV because the Heroku
// Node buildpack forces NODE_ENV='production' on every dyno, which would disable the dev/QA
// escape hatches below even on homolog. Falls back to NODE_ENV for local runs.
const appEnvironment = (env.APP_ENV || env.NODE_ENV || 'development') as ApplicationEnvironment
const isNonProduction = appEnvironment !== 'production'
// Dev/QA-only TDV mock mode: swaps the ServiceNow TDV client for an in-memory stateful mock.
// Gated to non-production regardless of the env var value.
const tdvMockEnabled = env.TDV_MOCK_ENABLED === 'true' && isNonProduction

export const config: Config = {
  application: {
    environment: appEnvironment,
    port: env.PORT ? parseInt(env.PORT) : DEFAULT_PORT,
  },
  idsp: getIdspConfig(),
  database: {
    connectionString: env.DATABASE_URL!
  },
  serviceNow: {
    csm: {
      baseUrl: env.SERVICENOW_CSM_BASE_URL || '',
      username: env.SERVICENOW_CSM_USERNAME || '',
      password: env.SERVICENOW_CSM_PASSWORD || '',
    },
    api: {
      baseUrl: env.SERVICENOW_API_BASE_URL || '',
      dashboardUrl
    },
    attestation: {
      baseUrl: env.SERVICENOW_ATTESTATION_BASE_URL || '',
    },
  },
  rotaCaixaPostal: {
    baseUrl: env.ROTA_CAIXA_POSTAL_BASE_URL || '',
    appTopic: env.ROTA_CAIXA_POSTAL_APP_TOPIC || '',
  },
  security: {
    encryptionKey: env.SESSION_ENCRYPTION_KEY || '',
    pseudonymousIdPepper: env.PSEUDONYMOUS_ID_PEPPER || '',
  },
  rotaVida: {
    vidaBaseUrl: env.ROTA_VIDA_BASE_URL || '',
    arquivosBaseUrl: env.ROTA_ARQUIVOS_BASE_URL || '',
    // Dev/QA-only escape hatch to test downstream TDV flows without a real biometric match.
    // Never honored when APP_ENV is 'production', regardless of the env var value. Also implied
    // by TDV mock mode, so the mocked prova-vida returns its fake code without an upload/match
    // round-trip.
    bypassMatch: (env.LIVENESS_BYPASS_MATCH === 'true' || tdvMockEnabled) && isNonProduction,
  },
  rotaCrvPecas: {
    baseUrl: env.ROTA_CRV_PECAS_BASE_URL || '',
    arquivosBaseUrl: env.ROTA_ARQUIVOS_BASE_URL || '',
  },
  rotaVistorias: {
    baseUrl: env.ROTA_VISTORIAS_BASE_URL || '',
  },
  iti: {
    baseUrl: env.ITI_BASE_URL || '',
    clientId: env.ITI_CLIENT_ID || '',
    redirectUri: env.ITI_REDIRECT_URI || '',
  },
  logging: {
    level: env.LOG_LEVEL || DEFAULT_LOG_LEVEL
  },
  posthog: {
    apiKey: env.POSTHOG_API_KEY || 'api-key',
    host: env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST
  },
  sentry: {
    dsn: env.SENTRY_DSN || ''
  },
  tdvMock: {
    enabled: tdvMockEnabled,
    versao: pickFromEnum<TdvMockVersao>('TDV_MOCK_VERSAO', env.TDV_MOCK_VERSAO, TDV_MOCK_VERSOES, '1.0'),
    sellerCpf: env.TDV_MOCK_SELLER_CPF || '',
    buyerCpf: env.TDV_MOCK_BUYER_CPF || '',
    vehiclePlate: env.TDV_MOCK_VEHICLE_PLATE || 'ABC1D23',
    vehicleRenavam: env.TDV_MOCK_VEHICLE_RENAVAM || '12345678901',
    initialEstado: env.TDV_MOCK_INITIAL_ESTADO || '',
    forceVehicleRestriction: env.TDV_MOCK_FORCE_VEHICLE_RESTRICTION === 'true' && isNonProduction,
    forceCidadesDiferentes: env.TDV_MOCK_FORCE_CIDADES_DIFERENTES === 'true' && isNonProduction,
    pendencia: pickFromEnum<TdvMockPendencia>('TDV_MOCK_PENDENCIA', env.TDV_MOCK_PENDENCIA, TDV_MOCK_PENDENCIAS, ''),
    validarTdv: pickFromEnum<TdvMockValidarTdv>('TDV_MOCK_VALIDAR_TDV', env.TDV_MOCK_VALIDAR_TDV, TDV_MOCK_VALIDAR_TDV, ''),
  }
}

// Keeps a typo in a dev/QA env var from silently changing which scenario the mock reproduces:
// an unrecognized value warns loudly and falls back instead of being coerced.
function pickFromEnum <T extends string> (
  name: string,
  raw: string | undefined,
  allowed: readonly string[],
  fallback: T
): T {
  const value = raw?.trim()
  if (!value) return fallback
  if (allowed.includes(value)) return value as T
  console.warn(`⚠️  ${name}="${value}" inválido (use ${allowed.join(' | ')}) — usando "${fallback}".`)
  return fallback
}

function getIdspConfig (): Config['idsp'] {
  const envScopes = env.GOVBR_IDSP_SCOPE?.split(/\s+/).filter(Boolean) ?? []

  return {
    authorizeUrl: env.GOVBR_IDSP_AUTHORIZE_URL || DEFAULT_GOVBR_AUTHORIZE_URL,
    tokenUrl: env.GOVBR_IDSP_TOKEN_URL || DEFAULT_GOVBR_TOKEN_URL,
    userInfoUrl: env.GOVBR_IDSP_USERINFO_URL || DEFAULT_GOVBR_USERINFO_URL,
    scope: [...new Set([...GOVBR_SCOPES, ...envScopes])].join(' '),
    android: {
      clientId: env.GOVBR_IDSP_ANDROID_CLIENT_ID || '',
      ...(env.GOVBR_IDSP_ANDROID_CLIENT_SECRET
        ? { clientSecret: env.GOVBR_IDSP_ANDROID_CLIENT_SECRET }
        : {}),
      redirectUri: env.GOVBR_IDSP_ANDROID_REDIRECT_URI || '',
    },
    ios: {
      clientId: env.GOVBR_IDSP_IOS_CLIENT_ID || '',
      ...(env.GOVBR_IDSP_IOS_CLIENT_SECRET
        ? { clientSecret: env.GOVBR_IDSP_IOS_CLIENT_SECRET }
        : {}),
      redirectUri: env.GOVBR_IDSP_IOS_REDIRECT_URI || '',
    },
  }
}
