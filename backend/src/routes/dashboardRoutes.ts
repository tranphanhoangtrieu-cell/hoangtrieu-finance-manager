import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RowDataPacket } from 'mysql2/promise';

import { db } from '../db';
import { jsonError } from '../http';
import { authMiddleware } from '../middleware/authMiddleware';
import { formatDdMmYyyy, formatMmYyyy, parseYyyyMmDd } from '../date';

type RangeKey = 'today' | 'week' | 'month' | 'year';
type DayStat = { label: string; income: number; expense: number };
type Totals = { income: number; expense: number; balance: number };

function clampEndToToday(d: Date): Date {
  const today = new Date();
  const end = new Date(d);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (end.getTime() > today.getTime()) return today;
  return end;
}

function dateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetweenInclusive(from: Date, to: Date): number {
  const a = dateOnly(from).getTime();
  const b = dateOnly(to).getTime();
  return Math.max(1, Math.floor((b - a) / 86400000) + 1);
}

function makeDateLabels(from: Date, to: Date): string[] {
  const labels: string[] = [];
  const cursor = dateOnly(from);
  const end = dateOnly(to);
  while (cursor.getTime() <= end.getTime()) {
    labels.push(formatDdMmYyyy(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return labels;
}

function makeWeekBuckets(from: Date, to: Date): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const cursor = dateOnly(from);
  const end = dateOnly(to);
  while (cursor.getTime() <= end.getTime()) {
    const start = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 6);
    if (bucketEnd.getTime() > end.getTime()) bucketEnd.setTime(end.getTime());
    buckets.push({ start, end: bucketEnd, label: `${formatDdMmYyyy(start)}–${formatDdMmYyyy(bucketEnd)}` });
    cursor.setDate(cursor.getDate() + 7);
  }
  return buckets;
}

function monthSpanLabels(from: Date, to: Date): { label: string; ym: string }[] {
  const labels: { label: string; ym: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor.getTime() <= end.getTime()) {
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    labels.push({ label: formatMmYyyy(cursor), ym });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return labels;
}

async function totalsAll(userId: string): Promise<Totals> {
  const [rows] = await db.query<(RowDataPacket & { income: number | null; expense: number | null })[]>(
    `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = ?
    `,
    [userId],
  );
  const income = Number(rows[0]?.income ?? 0);
  const expense = Number(rows[0]?.expense ?? 0);
  return { income, expense, balance: income - expense };
}

async function totalsBetween(userId: string, from: Date, to: Date): Promise<Totals> {
  const [rows] = await db.query<(RowDataPacket & { income: number | null; expense: number | null })[]>(
    `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `,
    [userId, from, to],
  );
  const income = Number(rows[0]?.income ?? 0);
  const expense = Number(rows[0]?.expense ?? 0);
  return { income, expense, balance: income - expense };
}

export const dashboardRoutes = Router();
dashboardRoutes.use(authMiddleware);

dashboardRoutes.get('/totals', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const totals = await totalsAll(userId);
  return res.json(totals);
});

dashboardRoutes.get('/stats', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const range = req.query.range as RangeKey;
  const today = dateOnly(new Date());

  if (range !== 'today' && range !== 'week' && range !== 'month' && range !== 'year') {
    return jsonError(res, 400, 'range không hợp lệ.');
  }

  if (range === 'year') {
    const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const to = today;
    const spans = monthSpanLabels(from, to);
    const [rows] = await db.query<(RowDataPacket & { ym: string; income: number; expense: number })[]>(
      `
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS ym,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE user_id = ?
          AND created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY ym
      `,
      [userId, from, to],
    );
    const byYm = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) => byYm.set(String(r.ym), { income: Number(r.income), expense: Number(r.expense) }));
    const items: DayStat[] = spans.map((s) => {
      const v = byYm.get(s.ym);
      return { label: s.label, income: v?.income ?? 0, expense: v?.expense ?? 0 };
    });
    return res.json({ items });
  }

  if (range === 'month') {
    const to = today;
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    const buckets = makeWeekBuckets(from, to);

    const [rows] = await db.query<(RowDataPacket & { d: string; income: number; expense: number })[]>(
      `
        SELECT
          DATE(created_at) AS d,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE user_id = ?
          AND created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY d
      `,
      [userId, from, to],
    );
    const byDate = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) => byDate.set(String(r.d), { income: Number(r.income), expense: Number(r.expense) }));

    const items: DayStat[] = buckets.map((b) => {
      let income = 0;
      let expense = 0;
      const cursor = new Date(b.start);
      while (cursor.getTime() <= b.end.getTime()) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const v = byDate.get(key);
        if (v) {
          income += v.income;
          expense += v.expense;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return { label: b.label, income, expense };
    });
    return res.json({ items });
  }

  const days = range === 'today' ? 1 : 7;
  const to = today;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  const labels = makeDateLabels(from, to);

  const [rows] = await db.query<(RowDataPacket & { d: string; income: number; expense: number })[]>(
    `
      SELECT
        DATE(created_at) AS d,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY d
    `,
    [userId, from, to],
  );
  const byDate = new Map<string, { income: number; expense: number }>();
  rows.forEach((r) => byDate.set(String(r.d), { income: Number(r.income), expense: Number(r.expense) }));

  const items: DayStat[] = labels.map((label) => {
    const [dd, mm, yyyy] = label.split('/');
    const key = `${yyyy}-${mm}-${dd}`;
    const v = byDate.get(key);
    return { label, income: v?.income ?? 0, expense: v?.expense ?? 0 };
  });
  return res.json({ items });
});

dashboardRoutes.get('/stats-between', async (req: Request, res: Response) => {
  const userId = req.user?.id ?? '';
  const fromText = typeof req.query.from === 'string' ? req.query.from : '';
  const toText = typeof req.query.to === 'string' ? req.query.to : '';
  const from0 = parseYyyyMmDd(fromText);
  const to0 = parseYyyyMmDd(toText);
  if (!from0 || !to0) return jsonError(res, 400, 'from/to không hợp lệ (yyyy-mm-dd).');

  const today = dateOnly(new Date());
  const from = clampEndToToday(from0);
  const to = clampEndToToday(to0);
  const start = from.getTime() <= to.getTime() ? from : to;
  const end = from.getTime() <= to.getTime() ? to : from;

  const spanDays = daysBetweenInclusive(start, end);
  if (spanDays <= 14) {
    const labels = makeDateLabels(start, end);
    const [rows] = await db.query<(RowDataPacket & { d: string; income: number; expense: number })[]>(
      `
        SELECT
          DATE(created_at) AS d,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE user_id = ?
          AND created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY d
      `,
      [userId, start, end],
    );
    const byDate = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) => byDate.set(String(r.d), { income: Number(r.income), expense: Number(r.expense) }));

    const items: DayStat[] = labels.map((label) => {
      const [dd, mm, yyyy] = label.split('/');
      const key = `${yyyy}-${mm}-${dd}`;
      const v = byDate.get(key);
      return { label, income: v?.income ?? 0, expense: v?.expense ?? 0 };
    });
    return res.json({ items });
  }

  if (spanDays <= 62) {
    const buckets = makeWeekBuckets(start, end);
    const [rows] = await db.query<(RowDataPacket & { d: string; income: number; expense: number })[]>(
      `
        SELECT
          DATE(created_at) AS d,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE user_id = ?
          AND created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY d
      `,
      [userId, start, end],
    );
    const byDate = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) => byDate.set(String(r.d), { income: Number(r.income), expense: Number(r.expense) }));

    const items: DayStat[] = buckets.map((b) => {
      let income = 0;
      let expense = 0;
      const cursor = new Date(b.start);
      while (cursor.getTime() <= b.end.getTime()) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const v = byDate.get(key);
        if (v) {
          income += v.income;
          expense += v.expense;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return { label: b.label, income, expense };
    });
    return res.json({ items });
  }

  const spans = monthSpanLabels(start, end);
  const [rows] = await db.query<(RowDataPacket & { ym: string; income: number; expense: number })[]>(
    `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS ym,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY ym
    `,
    [userId, start, end],
  );
  const byYm = new Map<string, { income: number; expense: number }>();
  rows.forEach((r) => byYm.set(String(r.ym), { income: Number(r.income), expense: Number(r.expense) }));
  const items: DayStat[] = spans.map((s) => {
    const v = byYm.get(s.ym);
    return { label: s.label, income: v?.income ?? 0, expense: v?.expense ?? 0 };
  });
  return res.json({ items });
});

