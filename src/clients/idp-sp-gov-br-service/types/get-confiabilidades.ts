export type Selo = 'Bronze' | 'Prata' | 'Ouro'

export type Confiabilidade = {
  id: string
  selo: Selo
  dataAtualizacao: string
}

export type ListConfiabilidadesResult = Confiabilidade[] | undefined
