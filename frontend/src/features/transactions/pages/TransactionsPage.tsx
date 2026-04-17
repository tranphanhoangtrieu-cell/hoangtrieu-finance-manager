import { useMemo, useState } from 'react';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Category } from '../../categories/types';
import type { Transaction, TransactionType } from '../types';
import { formatDateShort, formatMoneyVnd } from '../../../lib/format';
import { categoriesService } from '../../../services/categories.service';
import { transactionsService } from '../../../services/transactions.service';
import styles from './TransactionsPage.module.css';

function typeLabel(type: TransactionType) {
  return type === 'income' ? 'Thu' : 'Chi';
}

export function TransactionsPage() {
  const [categories] = useState<Category[]>(categoriesService.list());
  const [items, setItems] = useState<Transaction[]>(transactionsService.list());
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('50000');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [note, setNote] = useState('Ăn trưa');

  const canSubmit = useMemo(() => {
    if (!categoryId) return false;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (note.trim().length === 0) return false;
    return true;
  }, [amount, categoryId, note]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  return (
    <div className={styles.grid}>
      <Card title="Giao dịch thu/chi">
        <table className={styles.table}>
          <thead>
            <tr>
              <th align="left">Loại</th>
              <th align="left">Danh mục</th>
              <th align="right">Số tiền</th>
              <th align="left">Ghi chú</th>
              <th align="left">Ngày</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => {
              const c = categoryById.get(t.categoryId);
              return (
                <tr key={t.id} className={styles.row}>
                  <td>
                    <span className={[styles.pill, t.type === 'income' ? styles.income : styles.expense].join(' ')}>
                      {typeLabel(t.type)}
                    </span>
                  </td>
                  <td>{c ? c.name : '—'}</td>
                  <td align="right" className={styles.amount}>
                    {formatMoneyVnd(t.amount)}
                  </td>
                  <td>{t.note}</td>
                  <td>{formatDateShort(t.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const nextNote = prompt('Sửa ghi chú', t.note);
                          if (!nextNote) return;
                          transactionsService.update(t.id, { note: nextNote });
                          setItems(transactionsService.list());
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          transactionsService.remove(t.id);
                          setItems(transactionsService.list());
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Thêm giao dịch">
        <div className={styles.form}>
          <label>
            <div className={styles.muted}>Loại</div>
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
              <option value="expense">Chi</option>
              <option value="income">Thu</option>
            </select>
          </label>

          <Input label="Số tiền" value={amount} onChange={setAmount} type="number" />

          <label>
            <div className={styles.muted}>Danh mục</div>
            <select className={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <Input label="Ghi chú" value={note} onChange={setNote} placeholder="Ví dụ: Cafe" />

          <Button
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              const nextAmount = Number(amount);
              transactionsService.create({ type, amount: nextAmount, categoryId, note });
              setItems(transactionsService.list());
            }}
          >
            Thêm
          </Button>
        </div>
      </Card>
    </div>
  );
}

