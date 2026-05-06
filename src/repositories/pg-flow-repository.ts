import { SELECT } from 'pg-chain'

import {
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
  flowVersionId: string
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
    flowVersionId: row.flowVersionId,
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
        SELECT`flow.published_version_id AS "flowVersionId", flow_version.flow_json AS "flowJson"`
          .FROM`flow`
          .LEFT_JOIN`flow_version ON flow_version.id = flow.published_version_id`
          .WHERE`flow.id = ${flowId}`
          .AND`flow.status = 'published'`
          .AND`flow.published_version_id IS NOT NULL`
          .LIMIT`1`
      )

    const [row] = rows

    if (!row) {
      return null
    }

    return mapRowToPublishedFlowVersionByFlowId(row)
  }
}
