import type { DetranSpServiceNowAuth } from '../../clients/detran-sp-service-now/detran-sp-service-now-http'

export type VistoriasAuth = DetranSpServiceNowAuth

export type VerificaVistoriaInput = VistoriasAuth & {
  renavam: string
  placa: string
  tipoProcesso: string
  outroProcesso?: string
}

export type GeraAutorizacaoVistoriaInput = VistoriasAuth & {
  numeroPEV: string
  documento: string
}
