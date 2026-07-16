export type ConsultaPecaResult = {
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
  imagens: Array<{ url: string; descricao: string | null; sequencia: number }>
}
