import type { Request, Response } from 'express';
import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../db';
import { jsonError } from '../http';
import { hashPassword, signAccessToken, verifyPassword } from '../auth';

type UserRow = RowDataPacket & {
  id: string | number;
  name: string;
  email: string;
  password_hash: string;
};

function toUser(row: { id: string | number; name: string; email: string }) {
  return { id: String(row.id), name: row.name, email: row.email };
}

export const authRoutes = Router();

const defaultCategories = [
  { name: 'Ăn uống', color: '#f97316' },
  { name: 'Di chuyển', color: '#0ea5e9' },
  { name: 'Nhà ở', color: '#2563eb' },
  { name: 'Sức khoẻ', color: '#22c55e' },
  { name: 'Giải trí', color: '#a855f7' },
  { name: 'Mua sắm', color: '#ef4444' },
  { name: 'Học tập', color: '#f59e0b' },
  { name: 'Tiết kiệm', color: '#14b8a6' },
] as const;

authRoutes.post('/register', async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name) return jsonError(res, 400, 'Vui lòng nhập họ tên.');
  if (!email) return jsonError(res, 400, 'Vui lòng nhập email.');
  if (password.trim().length < 6) return jsonError(res, 400, 'Mật khẩu phải có ít nhất 6 ký tự.');

  const [existing] = await db.query<UserRow[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length > 0) return jsonError(res, 409, 'Email này đã được sử dụng.');

  const passwordHash = await hashPassword(password);
  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );

  const id = String(result.insertId);

  await Promise.all(
    defaultCategories.map((c) =>
      db.execute('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)', [id, c.name, c.color]),
    ),
  );

  const user = { id, name, email };
  const accessToken = signAccessToken(user);
  return res.status(201).json({ user, accessToken });
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email) return jsonError(res, 400, 'Vui lòng nhập email.');
  if (!password) return jsonError(res, 400, 'Vui lòng nhập mật khẩu.');

  const [rows] = await db.query<UserRow[]>('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
  const row = rows[0];
  if (!row) return jsonError(res, 401, 'Email hoặc mật khẩu không đúng.');

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return jsonError(res, 401, 'Email hoặc mật khẩu không đúng.');

  const user = toUser(row);
  const accessToken = signAccessToken(user);
  return res.json({ user, accessToken });
});

