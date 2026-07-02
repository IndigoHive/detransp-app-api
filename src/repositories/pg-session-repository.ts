import type { Config } from '../types'
import { encrypt, decrypt } from '../utils/crypto'
import { Database } from '../db/pool'
import type { CreateSessionParams, ISessionRepository, Session } from './types/session-repository'

export type PgSessionRepositoryOptions = {
  database: Database
  config: Config
}

type SessionRow = {
  id: string
  cpf: string
  platform: string
  encrypted_access_token: string
  encrypted_access_token_iv: string
  encrypted_refresh_token: string | null
  encrypted_refresh_token_iv: string | null
  user_info: Record<string, unknown>
  expires_at: Date
  created_at: Date
}

export class PgSessionRepository implements ISessionRepository {
  private db: Database
  private encryptionKey: string

  constructor({ database, config }: PgSessionRepositoryOptions) {
    this.db = database
    this.encryptionKey = config.security.encryptionKey
  }

  async upsert(params: CreateSessionParams): Promise<void> {
    const { encryptedValue: encAT, iv: ivAT } = encrypt(params.accessToken, this.encryptionKey)
    const encRT = params.refreshToken
      ? encrypt(params.refreshToken, this.encryptionKey)
      : null

    await this.db.query(
      `INSERT INTO sessions (
        id, cpf, platform,
        encrypted_access_token, encrypted_access_token_iv,
        encrypted_refresh_token, encrypted_refresh_token_iv,
        user_info, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (cpf) DO UPDATE SET
        id = EXCLUDED.id,
        platform = EXCLUDED.platform,
        encrypted_access_token = EXCLUDED.encrypted_access_token,
        encrypted_access_token_iv = EXCLUDED.encrypted_access_token_iv,
        encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
        encrypted_refresh_token_iv = EXCLUDED.encrypted_refresh_token_iv,
        user_info = EXCLUDED.user_info,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()`,
      [
        params.id,
        params.cpf,
        params.platform,
        encAT,
        ivAT,
        encRT?.encryptedValue ?? null,
        encRT?.iv ?? null,
        JSON.stringify(params.userInfo),
        params.expiresAt,
      ]
    )
  }

  async findById(id: string): Promise<Session | null> {
    const { rows } = await this.db.query<SessionRow>(
      'SELECT * FROM sessions WHERE id = $1 LIMIT 1',
      [id]
    )

    const row = rows[0]
    if (!row) return null

    return {
      id: row.id,
      cpf: row.cpf,
      platform: row.platform,
      accessToken: decrypt(row.encrypted_access_token, row.encrypted_access_token_iv, this.encryptionKey),
      refreshToken:
        row.encrypted_refresh_token && row.encrypted_refresh_token_iv
          ? decrypt(row.encrypted_refresh_token, row.encrypted_refresh_token_iv, this.encryptionKey)
          : null,
      userInfo: row.user_info,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE id = $1', [id])
  }
}
