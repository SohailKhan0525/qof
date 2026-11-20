export const placementCategories = [
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'reading', label: 'Reading' },
  { value: 'learning', label: 'Learning' },
  { value: 'culture', label: 'Culture' },
  { value: 'other', label: 'Other' },
] as const;

export type PlacementCategory = (typeof placementCategories)[number]['value'];

export function isPlacementCategory(value: unknown): value is PlacementCategory {
  return typeof value === 'string' && placementCategories.some(category => category.value === value);
}

export function categoryLabel(value: PlacementCategory): string {
  return placementCategories.find(category => category.value === value)?.label ?? 'Other';
}
