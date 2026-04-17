import type { Transaction, TransactionType } from '../features/transactions/types';

let transactions: Transaction[] = [
  {
    id: 't1',
    type: 'expense',
    amount: 50000,
    categoryId: 'c1',
    note: 'Ăn sáng',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    type: 'expense',
    amount: 120000,
    categoryId: 'c2',
    note: 'Đổ xăng',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 't3',
    type: 'income',
    amount: 2000000,
    categoryId: 'c4',
    note: 'Lương part-time',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function randomId() {
  return Math.random().toString(16).slice(2);
}

export const transactionsService = {
  list(): Transaction[] {
    return [...transactions];
  },

  create(input: { type: TransactionType; amount: number; categoryId: string; note: string }): Transaction {
    const next: Transaction = {
      id: randomId(),
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
    };
    transactions = [next, ...transactions];
    return next;
  },

  update(id: string, patch: { note?: string }): Transaction | null {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const curr = transactions[idx];
    const next: Transaction = { ...curr, note: patch.note ?? curr.note };
    transactions = transactions.map((t) => (t.id === id ? next : t));
    return next;
  },

  remove(id: string): void {
    transactions = transactions.filter((t) => t.id !== id);
  },
};

