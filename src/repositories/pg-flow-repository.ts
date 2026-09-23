import { SELECT } from 'pg-chain'

import {
  FlowAudience,
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
  category: string | null
  icon_name: string | null
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
    description: row.description,
    category: row.category,
    iconName: row.icon_name
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

  async list (audience: FlowAudience = 'logged'): Promise<ListFlowResultData[]> {
    const { rows } = await this.db
      .query<FlowRow>(
        audience === 'sessionless'
          ? SELECT`flow.id, flow.slug, flow.name, flow.description, flow.category, flow.icon_name`
              .FROM`flow`
              .JOIN`flow_version ON flow_version.id = flow.published_version_id`
              .WHERE`flow.status = 'published'`
              .AND`flow.published_version_id IS NOT NULL`
              .AND`flow_version.published_for_sessionless = true`
              .ORDER_BY`flow.created_at DESC`
          : SELECT`flow.id, flow.slug, flow.name, flow.description, flow.category, flow.icon_name`
              .FROM`flow`
              .JOIN`flow_version ON flow_version.id = flow.published_version_id`
              .WHERE`flow.status = 'published'`
              .AND`flow.published_version_id IS NOT NULL`
              .AND`flow_version.published_for_logged = true`
              .ORDER_BY`flow.created_at DESC`
      )

    return rows.map(mapRowToFlow)
  }

  async getPublishedFlowVersionByFlowId (
    flowId: string,
    audience: FlowAudience = 'logged'
  ): Promise<GetPublishedFlowVersionByFlowIdResultData | null> {
    const { rows } = await this.db
      .query<PublishedFlowVersionByFlowIdRow>(
        audience === 'sessionless'
          ? SELECT`flow.published_version_id AS "flowVersionId", flow_version.flow_json AS "flowJson"`
              .FROM`flow`
              .JOIN`flow_version ON flow_version.id = flow.published_version_id`
              .WHERE`flow.id = ${flowId}`
              .AND`flow.status = 'published'`
              .AND`flow.published_version_id IS NOT NULL`
              .AND`flow_version.published_for_sessionless = true`
              .LIMIT`1`
          : SELECT`flow.published_version_id AS "flowVersionId", flow_version.flow_json AS "flowJson"`
              .FROM`flow`
              .JOIN`flow_version ON flow_version.id = flow.published_version_id`
              .WHERE`flow.id = ${flowId}`
              .AND`flow.status = 'published'`
              .AND`flow.published_version_id IS NOT NULL`
              .AND`flow_version.published_for_logged = true`
              .LIMIT`1`
      )

    const [row] = rows

    if (!row) {
      return null
    }

    return mapRowToPublishedFlowVersionByFlowId(row)
  }
}
