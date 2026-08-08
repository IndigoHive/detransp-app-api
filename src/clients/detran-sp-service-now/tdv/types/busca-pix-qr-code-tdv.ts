import type { CodigoEstadoQRCode } from './_common'

export type BuscaPixQrCodeTdvResultSuccess = {
  result: {
    idQRCode: string
    qrCode: string
    dataExpiracaoQRCode: string
    estadoQRCode: CodigoEstadoQRCode | number
    idPagamentoQRCode?: string
    dataPagamentoQRCode?: string
  }
}

export type BuscaPixQrCodeTdvResult = BuscaPixQrCodeTdvResultSuccess | undefined
