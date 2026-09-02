import { asClass, type NameAndRegistrationPair } from 'awilix'
import { PostHogAnalyticsService } from './posthog-analytics-service'

export type AnalyticsServices = {
  analyticsService: PostHogAnalyticsService
}

export function getAnalyticsRegistrations (): Required<NameAndRegistrationPair<AnalyticsServices>> {
  return {
    analyticsService: asClass(PostHogAnalyticsService).scoped(),
  }
}
