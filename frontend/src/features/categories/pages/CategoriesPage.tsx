import { useMemo, useState } from 'react';

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
  const [items, setItems] = useState<Category[]>(categoriesService.list());
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const canSubmit = useMemo(() => name.trim().length > 0, [name]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  return (
    <div className={styles.grid}>
      <Card title="Danh mục">
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
                      onClick={() => {
                        const next = editingName.trim();
                        if (next.length === 0) return;
                        categoriesService.update(c.id, { name: next });
                        setItems(categoriesService.list());
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
                  onClick={() => {
                    categoriesService.remove(c.id);
                    setItems(categoriesService.list());
                    if (editingId === c.id) {
                      setEditingId(null);
                      setEditingName('');
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
            onClick={() => {
              if (!canSubmit) return;
              categoriesService.create({ name, color });
              setItems(categoriesService.list());
              setName('');
            }}
          >
            Thêm
          </Button>
        </div>
      </Card>
    </div>
  );
}

