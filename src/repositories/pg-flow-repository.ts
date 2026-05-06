import { SELECT } from 'pg-chain'

import {
  GetPublishedFlowJsonByFlowIdResultData,
  GetPublishedFlowVersionByFlowIdResultData,
  IFlowRepository,
  ListFlowResultData
} from './types/flow-repository'
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

type PublishedFlowVersionByFlowIdRow = {
  flowId: string
  flowVersionId: string
}

type PublishedFlowJsonByFlowIdRow = {
  flowId: string
  flowJson: unknown
}

function mapRowToFlow (row: FlowRow): ListFlowResultData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description
  }
}

function mapRowToPublishedFlowVersionByFlowId (
  row: PublishedFlowVersionByFlowIdRow
): GetPublishedFlowVersionByFlowIdResultData {
  return {
    flowId: row.flowId,
    flowVersionId: row.flowVersionId
  }
}

function mapRowToPublishedFlowJsonByFlowId (
  row: PublishedFlowJsonByFlowIdRow
): GetPublishedFlowJsonByFlowIdResultData {
  return {
    flowId: row.flowId,
    flowJson: row.flowJson
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

  async getPublishedFlowVersionByFlowId (
    flowId: string
  ): Promise<GetPublishedFlowVersionByFlowIdResultData | null> {
    const { rows } = await this.db
      .query<PublishedFlowVersionByFlowIdRow>(
        SELECT`id AS "flowId", published_flow_version_id AS "flowVersionId"`
          .FROM`flow`
          .WHERE`id = ${flowId}`
          .WHERE`status = 'published'`
          .WHERE`published_flow_version_id IS NOT NULL`
          .LIMIT`1`
      )

    const [row] = rows

    if (!row) {
      return null
    }

    return mapRowToPublishedFlowVersionByFlowId(row)
  }

  async getPublishedFlowJsonByFlowId (
    flowId: string
  ): Promise<GetPublishedFlowJsonByFlowIdResultData | null> {
    const { rows } = await this.db.query<PublishedFlowJsonByFlowIdRow>(
      `SELECT f.id AS "flowId", fv.flow_json AS "flowJson"
       FROM flow f
       INNER JOIN flow_version fv ON fv.id = f.published_flow_version_id
       WHERE f.id = $1
         AND f.status = 'published'
       LIMIT 1`,
      [flowId]
    )

    const [row] = rows

    if (!row) {
      return null
    }

    return mapRowToPublishedFlowJsonByFlowId(row)
  }
}
