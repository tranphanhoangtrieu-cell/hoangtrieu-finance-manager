import { useEffect, useMemo, useState } from 'react';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Category } from '../../categories/types';
import type { Transaction, TransactionType } from '../types';
import { formatMoneyVnd } from '../../../lib/format';
import { categoriesService } from '../../../services/categories.service';
import { transactionsService } from '../../../services/transactions.service';
import styles from './TransactionsPage.module.css';

function typeLabel(type: TransactionType) {
  return type === 'income' ? 'Thu' : 'Chi';
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function ddMmYyyyToIso(text: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return '';
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (Number.isNaN(dt.getTime())) return '';
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== mo || dt.getDate() !== d) return '';
  return toIsoDate(dt);
}

function formatDdMmYyyyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Transaction[]>([]);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('50000');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [dateText, setDateText] = useState<string>(() => isoToDdMmYyyy(toIsoDate(new Date())));
  const [loading, setLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<TransactionType>('expense');
  const [editingAmount, setEditingAmount] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [editingDateText, setEditingDateText] = useState('');

  async function reload() {
    setTableError('');
    setLoading(true);
    try {
      const [cats, txs] = await Promise.all([categoriesService.list(), transactionsService.list()]);
      setCategories(cats);
      setItems(txs);
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    const unsub = transactionsService.subscribe(() => void reload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return unsub;
  }, []);

  const canSubmit = useMemo(() => {
    if (!categoryId) return false;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (dateText.trim().length === 0) return false;
    if (!ddMmYyyyToIso(dateText)) return false;
    return true;
  }, [amount, categoryId, dateText]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  return (
    <div className={styles.grid}>
      <Card title="Giao dịch thu/chi">
        {tableError ? <div className={styles.error}>{tableError}</div> : null}
        {loading && items.length === 0 ? <div className={styles.loading}>Đang tải...</div> : null}
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
                    {editingId === t.id ? (
                      <select
                        className={[styles.select, styles.editSelect].join(' ')}
                        value={editingType}
                        onChange={(e) => setEditingType(e.target.value as TransactionType)}
                      >
                        <option value="expense">Chi</option>
                        <option value="income">Thu</option>
                      </select>
                    ) : (
                      <span className={[styles.pill, t.type === 'income' ? styles.income : styles.expense].join(' ')}>
                        {typeLabel(t.type)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <select
                        className={[styles.select, styles.editSelect].join(' ')}
                        value={editingCategoryId}
                        onChange={(e) => setEditingCategoryId(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (c ? c.name : '—')
                    )}
                  </td>
                  <td align="right" className={styles.amount}>
                    {editingId === t.id ? (
                      <input
                        className={[styles.editInput, styles.editAmount].join(' ')}
                        type="number"
                        value={editingAmount}
                        onChange={(e) => setEditingAmount(e.target.value)}
                      />
                    ) : (
                      formatMoneyVnd(t.amount)
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <input
                        className={styles.editInput}
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                      />
                    ) : (
                      t.note
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <input
                        className={[styles.editInput, styles.editDate].join(' ')}
                        inputMode="numeric"
                        maxLength={10}
                        value={editingDateText}
                        onChange={(e) => setEditingDateText(e.target.value)}
                        placeholder="dd/mm/yyyy"
                      />
                    ) : (
                      formatDdMmYyyyFromIso(t.createdAt)
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {editingId === t.id ? (
                        <>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              const nextAmount = Number(editingAmount);
                              const nextNote = editingNote.trim();
                              const createdAt = ddMmYyyyToIso(editingDateText);
                              if (!Number.isFinite(nextAmount) || nextAmount <= 0) return;
                              if (!createdAt) {
                                setTableError('Ngày không đúng định dạng dd/mm/yyyy.');
                                return;
                              }
                              if (createdAt > todayIso) {
                                setTableError('Không thể chọn ngày trong tương lai.');
                                return;
                              }
                              if (!editingCategoryId) return;
                              if (!nextNote) return;

                              setTableError('');
                              try {
                                await transactionsService.update(t.id, {
                                  type: editingType,
                                  amount: nextAmount,
                                  categoryId: editingCategoryId,
                                  note: nextNote,
                                  createdAt,
                                });
                                await reload();
                                setEditingId(null);
                              } catch (err) {
                                setTableError(err instanceof Error ? err.message : 'Không lưu được.');
                              }
                            }}
                          >
                            Lưu
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingId(null);
                            }}
                          >
                            Huỷ
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setTableError('');
                            setEditingId(t.id);
                            setEditingType(t.type);
                            setEditingAmount(String(t.amount));
                            setEditingCategoryId(t.categoryId || categories[0]?.id || '');
                            setEditingNote(t.note);
                            const d = new Date(t.createdAt);
                            setEditingDateText(
                              `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
                            );
                          }}
                        >
                          Sửa
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        onClick={async () => {
                          setTableError('');
                          try {
                            await transactionsService.remove(t.id);
                            await reload();
                            if (editingId === t.id) setEditingId(null);
                          } catch (err) {
                            setTableError(err instanceof Error ? err.message : 'Không xoá được.');
                          }
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
          <div className={styles.formRow2}>
            <label>
              <div className={styles.muted}>Loại</div>
              <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="expense">Chi</option>
                <option value="income">Thu</option>
              </select>
            </label>

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
          </div>

          <Input
            label="Ngày"
            value={dateText}
            onChange={(v) => {
              setFormError('');
              setDateText(v);
            }}
            type="text"
            placeholder="dd/mm/yyyy"
          />

          <Input label="Số tiền" value={amount} onChange={setAmount} type="number" />

          <Input label="Ghi chú" value={note} onChange={setNote} />

          <Button
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              const nextAmount = Number(amount);
              const createdAt = ddMmYyyyToIso(dateText);
              if (!createdAt) {
                setFormError('Ngày không đúng định dạng dd/mm/yyyy.');
                return;
              }
              if (createdAt > todayIso) {
                setFormError('Không thể chọn ngày trong tương lai.');
                return;
              }
              setFormError('');
              try {
                await transactionsService.create({ type, amount: nextAmount, categoryId, note, createdAt });
                await reload();
                setNote('');
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Không tạo được giao dịch.');
              }
            }}
          >
            Thêm
          </Button>
          {formError ? <div className={styles.formError}>{formError}</div> : null}
        </div>
      </Card>
    </div>
  );
}

