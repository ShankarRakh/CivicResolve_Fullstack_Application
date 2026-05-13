import { CATEGORIES } from '@/lib/constants'

/** Resolve category + subcategory names/icon from IDs stored in DB */
export function resolveCategory(categoryId: string, subcategoryId: string) {
  const category = CATEGORIES.find((c) => c.id === categoryId)
  const subcategory = category?.subcategories?.find(
    (s) => s.id === subcategoryId
  )

  return {
    categoryName: category?.name ?? categoryId,
    categoryIcon: category?.icon ?? 'FileText',
    subcategoryName: subcategory?.name ?? subcategoryId,
    slaHours: subcategory?.slaHours ?? 72,
  }
}
