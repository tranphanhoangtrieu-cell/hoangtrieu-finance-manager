import { useEffect, useMemo, useState } from 'react';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Category } from '../types';
import { categoriesService } from '../../../services/categories.service';
import styles from './CategoriesPage.module.css';

const palette = [
  { value: '#2563eb', label: 'Xanh dương', dotClass: styles.dotBlue },
  { value: '#f97316', label: 'Cam', dotClass: styles.dotOrange },
  { value: '#0ea5e9', label: 'Xanh nhạt', dotClass: styles.dotSky },
  { value: '#a855f7', label: 'Tím', dotClass: styles.dotPurple },
  { value: '#22c55e', label: 'Xanh lá', dotClass: styles.dotGreen },
] as const;

function dotClassFromColor(color: string): string {
  const found = palette.find((p) => p.value.toLowerCase() === color.toLowerCase());
  return found?.dotClass ?? styles.dotBlue;
}

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const canSubmit = useMemo(() => name.trim().length > 0, [name]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    setError('');
    setLoading(true);
    try {
      setItems(await categoriesService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh mục.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.grid}>
      <Card title="Danh mục">
        {error ? <div className={styles.error}>{error}</div> : null}
        {loading && items.length === 0 ? <div className={styles.loading}>Đang tải...</div> : null}
        <div className={styles.list}>
          {items.map((c) => (
            <div key={c.id} className={styles.row}>
              <div className={styles.left}>
                <span className={[styles.dot, dotClassFromColor(c.color)].join(' ')} aria-hidden="true" />
                {editingId === c.id ? (
                  <input
                    className={styles.editInput}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <div className={styles.name}>{c.name}</div>
                )}
              </div>
              <div className={styles.actions}>
                {editingId === c.id ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const next = editingName.trim();
                        if (next.length === 0) return;
                        setError('');
                        try {
                          await categoriesService.update(c.id, { name: next });
                          await reload();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Không lưu được.');
                        }
                        setEditingId(null);
                        setEditingName('');
                      }}
                    >
                      Lưu
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                    >
                      Huỷ
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditingName(c.name);
                    }}
                  >
                    Sửa
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={async () => {
                    setError('');
                    try {
                      await categoriesService.remove(c.id);
                      await reload();
                      if (editingId === c.id) {
                        setEditingId(null);
                        setEditingName('');
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Không xoá được.');
                    }
                  }}
                >
                  Xoá
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Thêm danh mục">
        <div className={styles.form}>
          <Input label="Tên danh mục" value={name} onChange={setName} placeholder="Ví dụ: Học tập" />
          <label className={styles.hint}>
            Màu
            <select className={styles.colorSelect} value={color} onChange={(e) => setColor(e.target.value)}>
              {palette.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              setError('');
              try {
                await categoriesService.create({ name, color });
                await reload();
                setName('');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Không tạo được danh mục.');
              }
            }}
          >
            Thêm
          </Button>
        </div>
      </Card>
    </div>
  );
}

