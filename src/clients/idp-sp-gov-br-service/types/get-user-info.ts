import { Confiabilidade } from "./get-confiabilidades"

export type GetUserInfoResult = {
  sub: string
  name?: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  picture?: string
  [key: string]: unknown
  confiabilidades?: Confiabilidade[]
}
