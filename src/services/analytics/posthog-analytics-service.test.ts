import type { PostHog } from 'posthog-node'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from '../../types'
import { derivePseudonymousId } from '../../utils/pseudonymous-id'
import { PostHogAnalyticsService } from './posthog-analytics-service'

const cpf = '05246487601'
const pepper = 'pepper-de-teste'

function buildService () {
  const capture = vi.fn()
  const posthog = { capture } as unknown as PostHog
  const config = { security: { pseudonymousIdPepper: pepper } } as unknown as Config

  return { capture, service: new PostHogAnalyticsService({ posthog, config }) }
}

describe('PostHogAnalyticsService', () => {
  it('sends the pseudonymous id as distinctId and never the raw cpf', () => {
    const { capture, service } = buildService()

    service.capture(cpf, 'govbr:sign_in_success')

    expect(capture).toHaveBeenCalledWith({
      distinctId: derivePseudonymousId(cpf, pepper),
      event: 'govbr:sign_in_success',
      properties: {}
    })
    expect(JSON.stringify(capture.mock.calls)).not.toContain(cpf)
  })

  it('falls back to Anonymous when there is no cpf', () => {
    const { capture, service } = buildService()

    service.capture(null, 'govbr:sign_in_success')

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: 'Anonymous' })
    )
  })

  it('forwards properties, including the $insert_id used for dedupe', () => {
    const { capture, service } = buildService()
    const insertId = service.createInsertId('licenciamento:qr_code_create:123')

    service.capture(cpf, 'licenciamento:qr_code_create', { $insert_id: insertId })

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ properties: { $insert_id: insertId } })
    )
  })

  it('derives a stable insert id from the same source', () => {
    const { service } = buildService()

    expect(service.createInsertId('mesma-origem')).toBe(service.createInsertId('mesma-origem'))
    expect(service.createInsertId('mesma-origem')).not.toBe(service.createInsertId('outra-origem'))
  })
})
