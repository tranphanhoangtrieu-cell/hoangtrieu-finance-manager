import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RowDataPacket } from 'mysql2/promise';

import { db } from '../db';
import { jsonError } from '../http';
import { authMiddleware } from '../middleware/authMiddleware';
import { toYyyyMmDd } from '../date';

type TransactionType = 'income' | 'expense';

type CategoryRow = RowDataPacket & { id: string | number; name: string; color: string };

type ParseResult = {
  type: TransactionType;
  amount: number | null;
  createdAt: string | null; // yyyy-mm-dd
  categoryId: string | null;
  note: string;
  confidence: 'low' | 'medium' | 'high';
};

function dateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDate(text: string): string | null {
  const t = text.toLowerCase();
  const today = dateOnly(new Date());
  if (/\bhôm\s+nay\b/.test(t)) return toYyyyMmDd(today);
  if (/\bhôm\s+qua\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return toYyyyMmDd(d);
  }
  if (/\bhôm\s+kia\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return toYyyyMmDd(d);
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const full = /(^|\s)(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(\s|$)/.exec(t);
  if (full) {
    const dd = Number(full[2]);
    const mm = Number(full[3]);
    const yyyy = Number(full[4]);
    const d = new Date(yyyy, mm - 1, dd);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() === yyyy && d.getMonth() + 1 === mm && d.getDate() === dd) {
      if (dateOnly(d).getTime() > today.getTime()) return null;
      return toYyyyMmDd(d);
    }
  }

  // dd/mm or dd-mm => assume current year
  const short = /(^|\s)(\d{1,2})[\/\-](\d{1,2})(\s|$)/.exec(t);
  if (short) {
    const dd = Number(short[2]);
    const mm = Number(short[3]);
    const yyyy = today.getFullYear();
    const d = new Date(yyyy, mm - 1, dd);
    if (!Number.isNaN(d.getTime()) && d.getMonth() + 1 === mm && d.getDate() === dd) {
      if (dateOnly(d).getTime() > today.getTime()) return null;
      return toYyyyMmDd(d);
    }
  }

  return null;
}

function parseAmount(text: string): number | null {
  const t = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // Examples:
  // 50k, 50 k, 50.000, 50,000, 2tr, 2 triệu, 1.5tr, 1tr5
  const m = /(\d+(?:[.,]\d+)?)(?:\s*)(k|nghìn|ngàn|tr|triệu|m|vnd|đ|d)?\b/.exec(t);
  if (!m) return null;

  const raw = m[1].replace(/,/g, '.');
  const base = Number(raw);
  if (!Number.isFinite(base) || base <= 0) return null;

  const unit = (m[2] ?? '').toLowerCase();
  if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') return Math.round(base * 1000);
  if (unit === 'tr' || unit === 'triệu') return Math.round(base * 1_000_000);
  if (unit === 'm') return Math.round(base * 1_000_000);
  return Math.round(base);
}

function detectType(text: string): TransactionType {
  const t = text.toLowerCase();
  if (/\b(thu|nhận|lương|hoàn\s+tiền|bonus|thưởng)\b/.test(t)) return 'income';
  if (/\b(chi|mua|trả|đóng|nạp|thanh\s+toán|cafe|ăn|uống)\b/.test(t)) return 'expense';
  return 'expense';
}

function splitSegments(text: string): string[] {
  return text
    .split(/[,，;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickCategoryId(text: string, categories: Array<{ id: string; name: string }>): string | null {
  const nt = normalize(text);
  let bestId: string | null = null;
  let bestScore = 0;
  for (const c of categories) {
    const name = normalize(c.name);
    if (!name) continue;
    if (!nt.includes(name)) continue;
    const score = name.length;
    if (score > bestScore) {
      bestScore = score;
      bestId = c.id;
    }
  }
  return bestId;
}

export const nlpRoutes = Router();

nlpRoutes.use(authMiddleware);

nlpRoutes.post('/parse', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return jsonError(res, 400, 'Vui lòng nhập nội dung.');

  const [cats] = await db.query<CategoryRow[]>('SELECT id, name, color FROM categories WHERE user_id = ? ORDER BY id DESC', [userId]);
  const categories = cats.map((c) => ({ id: String(c.id), name: c.name }));

  const segments = splitSegments(text);
  const fallbackDate = parseDate(text);

  const results: ParseResult[] = [];
  for (const segment of segments) {
    const type = detectType(segment);
    const amount = parseAmount(segment);
    const createdAt = parseDate(segment) ?? fallbackDate;
    const categoryId = pickCategoryId(segment, categories);
    const note = segment;

    const confidence: ParseResult['confidence'] =
      amount && createdAt && categoryId ? 'high' : amount && (createdAt || categoryId) ? 'medium' : 'low';

    results.push({ type, amount, createdAt, categoryId, note, confidence });
  }

  return res.json({ results, categories });
});

