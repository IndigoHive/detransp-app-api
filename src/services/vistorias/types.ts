export type VerificaVistoriaInput = {
  renavam: string
  placa: string
  tipoProcesso: string
  outroProcesso?: string
}

export type GeraAutorizacaoVistoriaInput = {
  numeroPEV: string
  documento: string
}
