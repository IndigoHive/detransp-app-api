export type ConsultaPecaSuccessResult = {
  isError: false
  empresa: {
    cnpj: string | null
    razaoSocial: string | null
    telefone: string | null
    email: string | null
    endereco: string | null
  } | null
  peca: {
    numeroIdentificacao: string
    tipo: string | null
    numeroMotor: string | null
    classificacao: string | null
  }
  veiculo: {
    placa: string | null
    chassi: string | null
    renavam: string | null
    marcaModelo: string | null
    cor: string | null
    anoFabricacao: string | null
    anoModelo: string | null
    combustivel: string | null
  }
  imagens: Array<{ binario: string; descricao: string | null; sequencia: number; codigo: string; extensao: string }>
  documentos: Array<{ binario: string; descricao: string | null; sequencia: number; codigo: string; extensao: string }>
  isEmpty: boolean
}

// Erro conhecido (403/500/400/404) vindo do rota-crv-pecas-client, normalizado em 200 para que o
// flow do app roteie no grafo (if_node/case_node) em vez de tratar como falha de HTTP.
export type ConsultaPecaErrorResult = {
  isError: true
  errorCode: number
  message: string
}

export type ConsultaPecaResult = ConsultaPecaSuccessResult | ConsultaPecaErrorResult
