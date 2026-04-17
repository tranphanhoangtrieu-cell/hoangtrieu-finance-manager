import { transactionsService } from './transactions.service';

export type Totals = { income: number; expense: number; balance: number };
export type DayStat = { label: string; income: number; expense: number };
export type RangeKey = 'today' | 'week' | 'month' | 'year';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDdMmYyyy(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatMmYyyy(d: Date): string {
  return `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseYyyyMmDd(value: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function makeSeries(labels: string[], unitBase: number): DayStat[] {
  return labels.map((label, i) => {
    const base = (i + 1) * unitBase;
    const expense = Math.round(base * (0.55 + (i % 4) * 0.12));
    const income = i % 5 === 0 ? Math.round(base * 1.35) : Math.round(base * 0.28);
    return { label, income, expense };
  });
}

function makeDateLabels(days: number, endDate: Date): string[] {
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    labels.push(formatDdMmYyyy(d));
  }
  return labels;
}

function makeMonthLabels(months: number): string[] {
  const today = new Date();
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    labels.push(formatMmYyyy(d));
  }
  return labels;
}

function makeWeekBuckets(from: Date, to: Date): string[] {
  const labels: string[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(cursor.getDate() + 6);
    if (end.getTime() > to.getTime()) end.setTime(to.getTime());
    labels.push(`${formatDdMmYyyy(start)}–${formatDdMmYyyy(end)}`);
    cursor.setDate(cursor.getDate() + 7);
  }
  return labels;
}

function monthSpanLabels(from: Date, to: Date): string[] {
  const labels: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor.getTime() <= end.getTime()) {
    labels.push(formatMmYyyy(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return labels;
}

export const dashboardService = {
  getTotals(): Totals {
    const items = transactionsService.list();
    const income = items.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = items.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  },

  getWeeklyStats(): DayStat[] {
    return makeSeries(makeDateLabels(7, new Date()), 100000);
  },

  getStats(range: RangeKey): DayStat[] {
    const today = new Date();
    if (range === 'today') return makeSeries(makeDateLabels(1, today), 450000);
    if (range === 'week') return makeSeries(makeDateLabels(7, today), 100000);
    if (range === 'month') {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return makeSeries(makeWeekBuckets(start, end), 450000);
    }
    return makeSeries(makeMonthLabels(12), 220000);
  },

  getStatsBetween(fromYyyyMmDd: string, toYyyyMmDd: string): DayStat[] {
    const from = parseYyyyMmDd(fromYyyyMmDd);
    const to = parseYyyyMmDd(toYyyyMmDd);
    if (!from || !to) return this.getStats('week');

    const start = from.getTime() <= to.getTime() ? from : to;
    const end = from.getTime() <= to.getTime() ? to : from;

    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);

    if (days <= 14) return makeSeries(makeDateLabels(days, end), 120000);
    if (days <= 62) return makeSeries(makeWeekBuckets(start, end), 420000);
    return makeSeries(monthSpanLabels(start, end), 850000);
  },
};

