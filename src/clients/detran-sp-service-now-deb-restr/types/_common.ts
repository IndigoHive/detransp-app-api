export type DateString = string
export type Renavam = string
export type Placa = string

export type CodigoDescricao = {
  codigo: number
  descricao: string
}

export const enum EstadoQRCodeCertidao {
  Ativo = 1,
  Pago = 2,
  Expirado = 3,
  Invalido = 4,
  NaoPago = 5
}
