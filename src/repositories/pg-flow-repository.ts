import { SELECT } from 'pg-chain'

import { IFlowRepository, ListFlowResultData } from './types/flow-repository'
import { Database } from '../db/pool'

export type PgFlowRepositoryOptions = {
  database: Database
}

type FlowRow = {
  id: string
  slug: string
  name: string
  description: string | null
}

function mapRowToFlow (row: FlowRow): ListFlowResultData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description
  }
}

export class PgFlowRepository implements IFlowRepository {
  private db: Database

  constructor (options: PgFlowRepositoryOptions) {
    this.db = options.database
  }

  async list (): Promise<ListFlowResultData[]> {
    const { rows } = await this.db
      .query<FlowRow>(
        SELECT`id, slug, name, description`
          .FROM`flow`
          .WHERE`status = 'published'`
          .ORDER_BY`created_at DESC`
      )

    return rows.map(mapRowToFlow)
  }
}
