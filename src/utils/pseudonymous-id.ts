import { createHmac } from 'node:crypto'

/**
 * Deriva um identificador pseudônimo estável a partir do CPF, para uso como
 * `distinct_id` em analytics de terceiros (PostHog).
 *
 * O CPF nunca pode ser enviado a um SaaS externo, e um `sha256(cpf)` puro não
 * protege nada: o espaço de CPFs válidos (~213 milhões) é pequeno o bastante
 * para ser enumerado por força bruta. O HMAC com um pepper que só existe no
 * servidor torna a reversão inviável para quem só tem o hash.
 *
 * Determinístico por (cpf, pepper): o mesmo usuário gera sempre o mesmo id,
 * então API e app convergem para a mesma pessoa no PostHog. Trocar o pepper
 * desassocia todo o histórico — é uma rotação destrutiva, não uma migração.
 */
export function derivePseudonymousId (cpf: string, pepper: string): string {
  return createHmac('sha256', pepper).update(cpf).digest('hex')
}
