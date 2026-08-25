import { IFlowRepository } from '../../../repositories/types/flow-repository'
import { ListFlowsResult } from '../../../types/list-flows'
import { createCategoryId, getCategoryIconName } from '../service-category'


export class ListFlowsService {
  private readonly flowRepository: IFlowRepository

  constructor(options: {
    flowRepository: IFlowRepository
  }) {
    this.flowRepository = options.flowRepository
  }

  async run (): Promise<ListFlowsResult> {
    const flows = await this.flowRepository.list()
    const categories = new Map<string, string>()

    for (const flow of flows) {
      if (!flow.category) continue

      const categoryId = createCategoryId(flow.category)
      if (categoryId && !categories.has(categoryId)) {
        categories.set(categoryId, flow.category)
      }
    }

    const result: ListFlowsResult = {
      filters: [
        { id: 'all', label: 'Todos', iconName: 'apps' },
        ...Array.from(categories, ([id, label]) => ({
          id,
          label,
          iconName: getCategoryIconName(id)
        })).sort((first, second) => first.label.localeCompare(second.label, 'pt-BR'))
      ],
      data: flows.map(flow => ({
        id: flow.id,
        slug: flow.slug,
        name: flow.name,
        description: flow.description,
        categoryId: flow.category ? createCategoryId(flow.category) : null,
        iconName: flow.iconName
      }))
    }

    return result
  }
}
