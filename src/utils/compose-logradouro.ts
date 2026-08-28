type EnderecoDoCep = {
  tipoLogradouro?: string | null
  endereco?: string | null
  logradouro?: string | null
}

// O ServiceNow devolve o logradouro partido em dois campos — `tipoLogradouro` ("Rua") separado
// de `endereco` ("Aulide Carini") — e o campo `logradouro`, já composto, vem nulo com frequência
// (é assim no próprio exemplo de resposta do nó Busca endereço). Ler só `logradouro ?? endereco`
// perdia o tipo: gravávamos "Aulide Carini" onde o app em produção grava "Rua Aulide Carini"
// (DadosCompradorScreen.kt:212 monta "${tipoLogradouro} ${endereco}").
//
// Compomos igual ao nativo, e não a partir de `logradouro`, para o tipo nunca sumir: quando os
// dois vêm preenchidos eles dizem a mesma coisa. `logradouro` fica só como último recurso, para
// o caso de um CEP que devolva o composto sem as partes.
export function composeLogradouro (endereco: EnderecoDoCep | undefined): string {
  const tipo = endereco?.tipoLogradouro?.trim()
  const nome = endereco?.endereco?.trim()

  if (nome) return tipo ? `${tipo} ${nome}` : nome
  return endereco?.logradouro?.trim() ?? ''
}
