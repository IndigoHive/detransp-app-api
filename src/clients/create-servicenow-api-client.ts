import axios, { AxiosInstance } from 'axios'
import { Config } from '../types'

export function createServiceNowApiClient (config: Config): AxiosInstance {
  return axios.create({
    baseURL: config.serviceNow.api.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
