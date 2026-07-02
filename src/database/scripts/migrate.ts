import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

async function migrate() {
  const pathname = path.join(__dirname, '..', 'migrations')
  const connectionString = process.env.DATABASE_URL
  const migrationFiles = (await fs.promises.readdir(pathname)).sort()

  const client = new Client({ connectionString })
  await client.connect()

  await client.query(`
    CREATE TABLE IF NOT EXISTS __migration (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      hash TEXT NOT NULL DEFAULT '',
      create_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await client.query(`
    ALTER TABLE __migration ADD COLUMN IF NOT EXISTS hash TEXT NOT NULL DEFAULT ''
  `)

  const { rows: appliedMigrations } = await client.query('SELECT name FROM __migration')
  const appliedMigrationsSet = new Set(appliedMigrations.map((row: { name: string }) => row.name))

  let skipped = 0
  let applied = 0

  for (const migrationFile of migrationFiles) {
    if (appliedMigrationsSet.has(migrationFile)) {
      skipped++
      continue
    }

    const filepath = path.join(pathname, migrationFile)
    const fileContent = await fs.promises.readFile(filepath, 'utf-8')

    try {
      const hash = createHash('sha256').update(fileContent).digest('hex')
      await client.query(fileContent)
      await client.query('INSERT INTO __migration (name, hash) VALUES ($1, $2)', [migrationFile, hash])
      applied++
      console.log(`Migration ${migrationFile} applied successfully.`)
    } catch (error) {
      console.error(`Migration ${migrationFile} failed:`, error)
      process.exit(1)
    }
  }

  console.log(`Applied ${applied} migrations, skipped ${skipped} migrations`)

  await client.end()
}

migrate()
