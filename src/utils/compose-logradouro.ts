type EnderecoDoCep = {
  tipoLogradouro?: string | null
  endereco?: string | null
  logradouro?: string | null
}

export function composeLogradouro (endereco: EnderecoDoCep | undefined): string {
  const tipo = endereco?.tipoLogradouro?.trim()
  const nome = endereco?.endereco?.trim()

  if (nome) return tipo ? `${tipo} ${nome}` : nome
  return endereco?.logradouro?.trim() ?? ''
}
