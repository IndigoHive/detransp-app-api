export class DetranSpServiceNowPgtoError extends Error {
  readonly type: string
  readonly responseData?: unknown
  readonly upstreamStatus: number | undefined

  constructor (type: string, message: string, responseData?: unknown, upstreamStatus?: number) {
    super(message)
    this.name = 'DetranSpServiceNowPgtoError'
    this.type = type
    this.responseData = responseData
    this.upstreamStatus = upstreamStatus
  }
}
