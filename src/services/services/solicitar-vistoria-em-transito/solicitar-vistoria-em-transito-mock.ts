import type { Logger } from 'pino'
import type { SolicitarVistoriaEmTransitoInput, SolicitarVistoriaEmTransitoResponse } from './types'

type Dependencies = {
  logger: Logger
}

const VISIBLE_DIGITS = 2

// Mascara só os dígitos (preserva pontos/barra/hífen do CPF/CNPJ formatado) e revela
// no máximo os últimos 2 dígitos — antes a regex contava posição de caractere, não de
// dígito, então separadores quebravam o lookahead e expunham a maioria dos números.
function maskDocument (value: string | undefined): string | undefined {
  if (!value) return value

  const totalDigits = (value.match(/\d/g) ?? []).length
  const visible = totalDigits > VISIBLE_DIGITS ? VISIBLE_DIGITS : 0
  let seen = 0

  return value.replace(/\d/g, (digit) => {
    seen++
    return seen > totalDigits - visible ? digit : '*'
  })
}

export class SolicitarVistoriaEmTransitoMockService {
  private readonly logger: Logger

  constructor ({ logger }: Dependencies) {
    this.logger = logger
  }

  async run (input: SolicitarVistoriaEmTransitoInput): Promise<SolicitarVistoriaEmTransitoResponse> {
    this.logger.info(
      {
        context: {
          ...input,
          cpfOuCnpj: maskDocument(input.cpfOuCnpj),
        },
      },
      '[MOCK:solicitar-vistoria-em-transito] solicitação recebida',
    )

    return {
      protocol: `MOCK-${Date.now()}`,
    }
  }
}
