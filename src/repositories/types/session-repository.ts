export type Session = {
  id: string
  cpf: string
  platform: string
  accessToken: string
  refreshToken: string | null
  userInfo: Record<string, unknown>
  expiresAt: Date
  createdAt: Date
}

export type CreateSessionParams = Omit<Session, 'createdAt'>

export interface ISessionRepository {
  upsert(params: CreateSessionParams): Promise<void>
  findById(id: string): Promise<Session | null>
  deleteById(id: string): Promise<void>
}
