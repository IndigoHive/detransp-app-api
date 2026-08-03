export class DetranSpServiceNowVistoriasError extends Error {
  constructor (
    public readonly type: string,
    message: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'DetranSpServiceNowVistoriasError'
  }
}
