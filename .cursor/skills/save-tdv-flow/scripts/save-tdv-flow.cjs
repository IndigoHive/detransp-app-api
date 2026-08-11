#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const skillRoot = path.resolve(__dirname, '..')
const apiRoot = path.resolve(skillRoot, '../../..')
const editorRoot = path.resolve(apiRoot, '../detransp-app-editor')

const defaultDatabaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/detransp_app_dev'
const defaultFlowJsonPath = path.join(apiRoot, 'mock-data/tdv-flow.json')
const defaultSlug = 'tdv'

function readEnvDatabaseUrl () {
  const envPath = path.join(editorRoot, 'apps/admin-api/.env.development')
  if (!fs.existsSync(envPath)) return undefined
  const match = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
  if (!match) return undefined
  return match[1].trim().replace(/^["']|["']$/g, '')
}

function loadPg () {
  const candidates = [
    path.join(editorRoot, 'node_modules/pg'),
    path.join(apiRoot, 'node_modules/pg')
  ]
  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch {
      // try next
    }
  }
  try {
    return createRequire(path.join(editorRoot, 'package.json'))('pg')
  } catch {
    // fall through
  }
  throw new Error(
    `Cannot resolve package "pg". Install dependencies in detransp-app-editor (expected at ${editorRoot}).`
  )
}

async function main () {
  const flowJsonPath = process.env.FLOW_JSON_PATH || defaultFlowJsonPath
  const databaseUrl = process.env.DATABASE_URL || readEnvDatabaseUrl() || defaultDatabaseUrl
  const slug = process.env.FLOW_SLUG || defaultSlug

  if (databaseUrl.includes('detransp_app_test')) {
    throw new Error('Refusing to write to detransp_app_test')
  }

  if (!fs.existsSync(flowJsonPath)) {
    throw new Error(`Flow JSON not found: ${flowJsonPath}`)
  }

  const flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf8'))
  const { Client } = loadPg()
  const client = new Client({ connectionString: databaseUrl })

  await client.connect()
  try {
    await client.query('BEGIN')

    const flowResult = await client.query(
      `SELECT id, slug, name, published_version_id
       FROM flow
       WHERE slug = $1`,
      [slug]
    )

    if (flowResult.rowCount !== 1) {
      throw new Error(`Expected exactly one flow with slug "${slug}", found ${flowResult.rowCount}`)
    }

    const flow = flowResult.rows[0]
    if (!flow.published_version_id) {
      throw new Error(`Flow "${slug}" has no published_version_id`)
    }

    const update = await client.query(
      `UPDATE flow_version
       SET flow_json = $1::jsonb, updated_at = now()
       WHERE id = $2
       RETURNING id, flow_id, version_number, updated_at, pg_column_size(flow_json) AS json_bytes`,
      [JSON.stringify(flowJson), flow.published_version_id]
    )

    if (update.rowCount !== 1) {
      throw new Error(`Expected 1 updated flow_version row, got ${update.rowCount}`)
    }

    await client.query(
      `UPDATE flow SET updated_at = now() WHERE id = $1`,
      [flow.id]
    )

    await client.query('COMMIT')

    console.log(JSON.stringify({
      ok: true,
      source: flowJsonPath,
      database: databaseUrl.replace(/:[^:@/]+@/, ':***@'),
      flow: {
        id: flow.id,
        slug: flow.slug,
        name: flow.name
      },
      version: update.rows[0]
    }, null, 2))
  } catch (error) {
    try { await client.query('ROLLBACK') } catch { /* ignore */ }
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
