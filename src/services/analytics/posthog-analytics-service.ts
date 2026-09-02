import { createHash } from 'node:crypto'
import type { PostHog } from 'posthog-node'
import type { Config } from '../../types'
import { derivePseudonymousId } from '../../utils/pseudonymous-id'

type GovBrEvent = 'govbr:sign_in_success'

type LicenciamentoEvent =
  | 'licenciamento:qr_code_create'
  | 'licenciamento:pix_pay'
  | 'licenciamento:crlve_send'
  | 'licenciamento:crlve_failure'

type DebitosEvent =
  | 'debitos:vehicle_query'
  | 'debitos:pix_generate'
  | 'debitos:pix_pay'
  | 'debitos:certidao_pix_generate'
  | 'debitos:certidao_emit'

type VistoriasEvent =
  | 'vistorias:vehicle_check'
  | 'vistorias:qr_code_create'
  | 'vistorias:payment_confirm'
  | 'vistorias:authorization_generate'
  | 'vistorias:refund_request'

type TdvEvent =
  | 'tdv:create'
  | 'tdv:sale_data_submit'
  | 'tdv:atpve_create'
  | 'tdv:intent_confirm'
  | 'tdv:residence_declaration_confirm'
  | 'tdv:buyer_sign'
  | 'tdv:seller_sign'
  | 'tdv:signature_link_generate'
  | 'tdv:pix_generate'
  | 'tdv:pix_pay'
  | 'tdv:validate'
  | 'tdv:cancel'

export type AnalyticsEvent =
  | GovBrEvent
  | LicenciamentoEvent
  | DebitosEvent
  | VistoriasEvent
  | TdvEvent

export type AnalyticsEventProperties = {
  $insert_id?: string
  /** Só em `tdv:validate`: qual ramo de validação a TDV caiu. */
  proxima_acao?: string
  /** Só em `debitos:pix_generate`: ipva | multas | licenciamento | total. */
  tipo?: string
  channel: string
}

export interface IAnalyticsService {
  createInsertId(source: string): string
  capture(cpf: string | null | undefined, event: AnalyticsEvent, properties?: AnalyticsEventProperties): void
}

type Dependencies = {
  posthog: PostHog
  config: Config
}

export class PostHogAnalyticsService implements IAnalyticsService {
  private readonly posthog: PostHog
  private readonly pepper: string

  constructor ({ posthog, config }: Dependencies) {
    this.posthog = posthog
    this.pepper = config.security.pseudonymousIdPepper
  }

  /**
   * Chave de idempotência para o PostHog: eventos com o mesmo `$insert_id` são
   * deduplicados do lado deles. Use quando o mesmo evento de negócio pode ser
   * disparado duas vezes (retry, caminho de recuperação), derivando a chave de
   * algo estável da operação — não de um timestamp.
   */
  createInsertId (source: string): string {
    return createHash('sha256').update(source).digest('hex')
  }

  /**
   * Recebe o CPF e o converte em id pseudônimo aqui dentro — o pepper não sai
   * desta classe e nenhum serviço de negócio precisa conhecê-lo. Falha de
   * entrega nunca sobe como exceção: o handler de erro registrado no container
   * apenas loga (analytics não pode derrubar um request).
   */
  capture (cpf: string | null | undefined, event: AnalyticsEvent, properties?: AnalyticsEventProperties): void {
    this.posthog.capture({
      distinctId: cpf ? derivePseudonymousId(cpf, this.pepper) : 'Anonymous',
      event,
      properties: { ...properties, channel: 'app-api' }
    })
  }
}
