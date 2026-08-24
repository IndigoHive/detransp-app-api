const CATEGORY_ICON_NAMES: Readonly<Record<string, string>> = {
  multas: 'gavel',
  veiculos: 'directions-car',
  habilitacao: 'card-membership'
}

export function createCategoryId (category: string): string {
  return category
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getCategoryIconName (categoryId: string): string {
  return CATEGORY_ICON_NAMES[categoryId] ?? 'category'
}
