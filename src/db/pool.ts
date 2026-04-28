import type {
  Client,
  Pool,
  PoolClient,
  QueryConfig,
  QueryResult,
  QueryResultRow
} from 'pg'

export type DatabaseOptions = {
  pg: Pool | PoolClient | Client
}

export class Database {
  private pg: Pool | PoolClient | Client

  constructor (options: DatabaseOptions) {
    this.pg = options.pg
  }

  query<T extends QueryResultRow>(config: QueryConfig): Promise<QueryResult<T>>
  query<T extends QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>>
  async query<T extends QueryResultRow>(
    queryTextOrConfig: string | QueryConfig,
    params?: unknown
  ): Promise<QueryResult<T>> {
    // const before = performance.now()

    const result = await this.pg.query<T>(queryTextOrConfig as any, params as any)

    // const after = performance.now()

    // const duration = Number((after - before).toFixed(3))

    // const sql = queryTextOrConfig instanceof Object ? queryTextOrConfig.text : queryTextOrConfig

    // this.logger.trace({ duration, sql }, 'Executed query')

    return result
  }
}
