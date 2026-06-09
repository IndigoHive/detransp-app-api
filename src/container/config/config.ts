import { ApplicationEnvironment, Config } from '../../types'
import { env } from './env'

const DEFAULT_PORT = 3500
const DEFAULT_LOG_LEVEL = 'info'
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

export const config: Config = {
  application: {
    environment: (env.NODE_ENV || 'development') as ApplicationEnvironment,
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
    tdv: {
      baseUrl: env.SERVICENOW_TDV_BASE_URL || '',
      username: env.SERVICENOW_TDV_USERNAME || '',
      password: env.SERVICENOW_TDV_PASSWORD || '',
    }
  },
  rotaCaixaPostal: {
    // Defina ROTA_CAIXA_POSTAL_BASE_URL no .env (ex: https://caixapostal.api.rota.sp.gov.br)
    baseUrl: env.ROTA_CAIXA_POSTAL_BASE_URL || '',
    // Defina ROTA_CAIXA_POSTAL_APP_TOPIC no .env (ex: detran-sp)
    appTopic: env.ROTA_CAIXA_POSTAL_APP_TOPIC || '',
  },
  logging: {
    level: env.LOG_LEVEL || DEFAULT_LOG_LEVEL
  }
}

function getIdspConfig (): Config['idsp'] {
  return {
    clientId: env.GOVBR_IDSP_CLIENT_ID || '',
    ...(env.GOVBR_IDSP_CLIENT_SECRET
      ? { clientSecret: env.GOVBR_IDSP_CLIENT_SECRET }
      : {}),
    ...(env.GOVBR_IDSP_AUDIENCE
      ? { audience: env.GOVBR_IDSP_AUDIENCE }
      : {}),
    authorizeUrl: env.GOVBR_IDSP_AUTHORIZE_URL || DEFAULT_GOVBR_AUTHORIZE_URL,
    tokenUrl: env.GOVBR_IDSP_TOKEN_URL || DEFAULT_GOVBR_TOKEN_URL,
    userInfoUrl: env.GOVBR_IDSP_USERINFO_URL || DEFAULT_GOVBR_USERINFO_URL,
    redirectUri: env.GOVBR_IDSP_REDIRECT_URI || '',
    scope: GOVBR_SCOPES.join(' '),
  }
}
