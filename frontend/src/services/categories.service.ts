import type { Category } from '../features/categories/types';

let categories: Category[] = [
  { id: 'c1', name: 'Ăn uống', color: '#f97316' },
  { id: 'c2', name: 'Di chuyển', color: '#0ea5e9' },
  { id: 'c3', name: 'Giải trí', color: '#a855f7' },
  { id: 'c4', name: 'Tiết kiệm', color: '#22c55e' },
];

function randomId() {
  return Math.random().toString(16).slice(2);
}

export const categoriesService = {
  list(): Category[] {
    return [...categories];
  },

  create(input: { name: string; color: string }): Category {
    const next: Category = { id: randomId(), name: input.name.trim(), color: input.color };
    categories = [next, ...categories];
    return next;
  },

  update(id: string, patch: { name?: string; color?: string }): Category | null {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const curr = categories[idx];
    const next: Category = {
      ...curr,
      name: patch.name ?? curr.name,
      color: patch.color ?? curr.color,
    };
    categories = categories.map((c) => (c.id === id ? next : c));
    return next;
  },

  remove(id: string): void {
    categories = categories.filter((c) => c.id !== id);
  },
};

