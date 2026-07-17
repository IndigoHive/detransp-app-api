export type VeiculoVistoriaRaw = {
  placa: string | null
  anoModelo: number | null
  mercosul: boolean
  chassis: string | null
  renavam: number | null
  codigoMunicipio: number | null
  descricaoMunicipio: string | null
  uf: string | null
  anoFabricacao: number | null
  dataInclusao: string | null
  dataMovimento: string | null
  dataEmissao: string | null
  anoExercicio: number | null
  dataEmissaoLicenciamento: string | null
  capacidadePassageiros: number | null
  capacidadeCarga: number | null
  potencia: number | null
  cilindrada: number | null
  comprimento: number | null
  pesoBrutoTotal: number | null
  sinistro: number | null
  seguradora: string | null
  numeroMotor: string | null
  marca: { codigo: number; descricao: string } | null
  categoria: { codigo: number; descricao: string } | null
  tipo: { codigo: number; descricao: string } | null
  carroceria: { codigo: number; descricao: string } | null
  cor: { codigo: number; descricao: string } | null
  combustivel: { codigo: number; descricao: string } | null
  especie: { codigo: number; descricao: string } | null
  origem: { codigo: number; descricao: string } | null
  monta: { codigo: number; descricao: string } | null
  proprietario: {
    cpfCnpj: string | null
    nome: string | null
    municipio: { codigo: number; nome: string; uf: string } | null
  } | null
}
