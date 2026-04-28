import type { Request, Response } from 'express';
import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../db';
import { jsonError } from '../http';
import { authMiddleware } from '../middleware/authMiddleware';
import { parseYyyyMmDd, toYyyyMmDd } from '../date';

type TransactionType = 'income' | 'expense';

type TransactionRow = RowDataPacket & {
  id: string | number;
  user_id: string | number;
  type: TransactionType;
  amount: number;
  category_id: string | number | null;
  note: string;
  created_at: string;
};

function toTransaction(row: TransactionRow) {
  return {
    id: String(row.id),
    type: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id === null ? '' : String(row.category_id),
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const transactionsRoutes = Router();
transactionsRoutes.use(authMiddleware);

function toNoonTimestamp(isoDate: string): string {
  // Use noon to reduce timezone surprises when converting back to ISO in JS.
  return `${isoDate} 12:00:00`;
}

transactionsRoutes.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const [rows] = await db.query<TransactionRow[]>(
    'SELECT id, user_id, type, amount, category_id, note, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC',
    [userId],
  );
  return res.json({ items: rows.map(toTransaction) });
});

transactionsRoutes.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const type = req.body?.type === 'income' || req.body?.type === 'expense' ? (req.body.type as TransactionType) : '';
  const amount = Number(req.body?.amount);
  const categoryIdRaw = typeof req.body?.categoryId === 'string' ? req.body.categoryId.trim() : '';
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  const createdAtText = typeof req.body?.createdAt === 'string' ? req.body.createdAt.trim() : '';

  if (type !== 'income' && type !== 'expense') return jsonError(res, 400, 'Loại giao dịch không hợp lệ.');
  if (!Number.isFinite(amount) || amount <= 0) return jsonError(res, 400, 'Số tiền không hợp lệ.');
  const safeNote = note;

  const categoryId = categoryIdRaw ? categoryIdRaw : null;
  if (categoryId) {
    const [cats] = await db.query<RowDataPacket[]>('SELECT id FROM categories WHERE id = ? AND user_id = ? LIMIT 1', [
      categoryId,
      userId,
    ]);
    if (cats.length === 0) return jsonError(res, 400, 'Danh mục không hợp lệ.');
  }

  let createdAtSql: string | null = null;
  if (createdAtText) {
    const parsed = parseYyyyMmDd(createdAtText);
    if (!parsed) return jsonError(res, 400, 'Ngày không hợp lệ (yyyy-mm-dd).');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(parsed);
    picked.setHours(0, 0, 0, 0);
    if (picked.getTime() > today.getTime()) return jsonError(res, 400, 'Không thể chọn ngày trong tương lai.');
    createdAtSql = toNoonTimestamp(toYyyyMmDd(picked));
  }

  const [result] = await db.execute<ResultSetHeader>(
    createdAtSql
      ? 'INSERT INTO transactions (user_id, type, amount, category_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      : 'INSERT INTO transactions (user_id, type, amount, category_id, note) VALUES (?, ?, ?, ?, ?)',
    createdAtSql
      ? [userId, type, Math.round(amount), categoryId, safeNote, createdAtSql]
      : [userId, type, Math.round(amount), categoryId, safeNote],
  );

  const [rows] = await db.query<TransactionRow[]>(
    'SELECT id, user_id, type, amount, category_id, note, created_at FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
    [String(result.insertId), userId],
  );
  const row = rows[0];
  if (!row) return jsonError(res, 500, 'Không tạo được giao dịch.');
  return res.status(201).json({ item: toTransaction(row) });
});

transactionsRoutes.put('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const id = String(req.params.id ?? '').trim();
  if (!id) return jsonError(res, 400, 'Thiếu id giao dịch.');

  const patch: Partial<{
    type: TransactionType;
    amount: number;
    note: string;
    categoryId: string;
    createdAt: string; // yyyy-mm-dd
  }> = {};

  if (req.body?.type !== undefined) {
    const type = req.body?.type === 'income' || req.body?.type === 'expense' ? (req.body.type as TransactionType) : '';
    if (type !== 'income' && type !== 'expense') return jsonError(res, 400, 'Loại giao dịch không hợp lệ.');
    patch.type = type;
  }

  if (req.body?.amount !== undefined) {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return jsonError(res, 400, 'Số tiền không hợp lệ.');
    patch.amount = Math.round(amount);
  }

  if (req.body?.note !== undefined) {
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    patch.note = note;
  }

  if (req.body?.categoryId !== undefined) {
    const categoryId = typeof req.body.categoryId === 'string' ? req.body.categoryId.trim() : '';
    if (!categoryId) return jsonError(res, 400, 'Danh mục không hợp lệ.');
    const [cats] = await db.query<RowDataPacket[]>('SELECT id FROM categories WHERE id = ? AND user_id = ? LIMIT 1', [
      categoryId,
      userId,
    ]);
    if (cats.length === 0) return jsonError(res, 400, 'Danh mục không hợp lệ.');
    patch.categoryId = categoryId;
  }

  if (req.body?.createdAt !== undefined) {
    const createdAtText = typeof req.body.createdAt === 'string' ? req.body.createdAt.trim() : '';
    if (!createdAtText) return jsonError(res, 400, 'Ngày không hợp lệ (yyyy-mm-dd).');
    const parsed = parseYyyyMmDd(createdAtText);
    if (!parsed) return jsonError(res, 400, 'Ngày không hợp lệ (yyyy-mm-dd).');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(parsed);
    picked.setHours(0, 0, 0, 0);
    if (picked.getTime() > today.getTime()) return jsonError(res, 400, 'Không thể chọn ngày trong tương lai.');
    patch.createdAt = toYyyyMmDd(picked);
  }

  if (
    patch.type === undefined &&
    patch.amount === undefined &&
    patch.note === undefined &&
    patch.categoryId === undefined &&
    patch.createdAt === undefined
  ) {
    return jsonError(res, 400, 'Không có dữ liệu cập nhật.');
  }

  const [currRows] = await db.query<TransactionRow[]>(
    'SELECT id, user_id, type, amount, category_id, note, created_at FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId],
  );
  const curr = currRows[0];
  if (!curr) return jsonError(res, 404, 'Không tìm thấy giao dịch.');

  const nextType = patch.type ?? curr.type;
  const nextAmount = patch.amount ?? Number(curr.amount);
  const nextNote = patch.note ?? curr.note;
  const nextCategoryId = patch.categoryId ?? (curr.category_id === null ? '' : String(curr.category_id));
  const nextCreatedAtSql = patch.createdAt ? toNoonTimestamp(patch.createdAt) : null;

  await db.execute('UPDATE transactions SET type = ?, amount = ?, note = ?, category_id = ?, created_at = ? WHERE id = ? AND user_id = ?', [
    nextType,
    nextAmount,
    nextNote,
    nextCategoryId ? nextCategoryId : null,
    nextCreatedAtSql ?? curr.created_at,
    id,
    userId,
  ]);

  const [rows] = await db.query<TransactionRow[]>(
    'SELECT id, user_id, type, amount, category_id, note, created_at FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId],
  );
  const row = rows[0];
  if (!row) return jsonError(res, 500, 'Không cập nhật được giao dịch.');
  return res.json({ item: toTransaction(row) });
});

transactionsRoutes.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const id = String(req.params.id ?? '').trim();
  if (!id) return jsonError(res, 400, 'Thiếu id giao dịch.');

  const [result] = await db.execute<ResultSetHeader>('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) return jsonError(res, 404, 'Không tìm thấy giao dịch.');
  return res.status(204).send();
});

