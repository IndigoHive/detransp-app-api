import axios, { AxiosInstance } from 'axios'
import { Config } from '../types'

export function createServiceNowCsmClient (config: Config): AxiosInstance {
  const { baseUrl, username, password } = config.serviceNow.csm

  return axios.create({
    baseURL: baseUrl,
    auth: {
      username,
      password,
    },
  })
}
