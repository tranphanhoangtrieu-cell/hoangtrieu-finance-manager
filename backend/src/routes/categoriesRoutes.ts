import type { Request, Response } from 'express';
import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../db';
import { jsonError } from '../http';
import { authMiddleware } from '../middleware/authMiddleware';

type CategoryRow = RowDataPacket & {
  id: string | number;
  user_id: string | number;
  name: string;
  color: string;
};

function toCategory(row: { id: string | number; name: string; color: string }) {
  return { id: String(row.id), name: row.name, color: row.color };
}

export const categoriesRoutes = Router();

categoriesRoutes.use(authMiddleware);

categoriesRoutes.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const [rows] = await db.query<CategoryRow[]>('SELECT id, user_id, name, color FROM categories WHERE user_id = ? ORDER BY id DESC', [
    userId,
  ]);
  return res.json({ items: rows.map((r) => toCategory(r)) });
});

categoriesRoutes.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const color = typeof req.body?.color === 'string' ? req.body.color.trim() : '';
  if (!name) return jsonError(res, 400, 'Vui lòng nhập tên danh mục.');
  if (!color) return jsonError(res, 400, 'Vui lòng chọn màu.');

  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
    [userId, name, color],
  );

  return res.status(201).json({ item: { id: String(result.insertId), name, color } });
});

categoriesRoutes.put('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const id = String(req.params.id ?? '').trim();
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
  const color = typeof req.body?.color === 'string' ? req.body.color.trim() : undefined;

  if (!id) return jsonError(res, 400, 'Thiếu id danh mục.');
  if (name !== undefined && name.trim() === '') return jsonError(res, 400, 'Tên danh mục không được để trống.');
  if (color !== undefined && color.trim() === '') return jsonError(res, 400, 'Màu không hợp lệ.');
  if (name === undefined && color === undefined) return jsonError(res, 400, 'Không có dữ liệu cập nhật.');

  const [rows] = await db.query<CategoryRow[]>(
    'SELECT id, user_id, name, color FROM categories WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId],
  );
  const curr = rows[0];
  if (!curr) return jsonError(res, 404, 'Không tìm thấy danh mục.');

  const nextName = name ?? curr.name;
  const nextColor = color ?? curr.color;
  await db.execute('UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?', [nextName, nextColor, id, userId]);
  return res.json({ item: toCategory({ id, name: nextName, color: nextColor }) });
});

categoriesRoutes.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const id = String(req.params.id ?? '').trim();
  if (!id) return jsonError(res, 400, 'Thiếu id danh mục.');

  const [result] = await db.execute<ResultSetHeader>('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) return jsonError(res, 404, 'Không tìm thấy danh mục.');
  return res.status(204).send();
});

