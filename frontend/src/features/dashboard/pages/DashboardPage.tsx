import { Card } from '../../../components/ui/Card';
import { formatMoneyVnd } from '../../../lib/format';
import { dashboardService, type RangeKey } from '../../../services/dashboard.service';
import { transactionsService } from '../../../services/transactions.service';
import styles from './DashboardPage.module.css';
import { useEffect, useMemo, useState } from 'react';

function toHeightClass(value: number, maxValue: number): string {
  const pct = Math.max((value / maxValue) * 100, 6);
  const bucket = Math.min(100, Math.max(10, Math.round(pct / 10) * 10));
  return styles[`h${bucket}` as keyof typeof styles];
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

export function DashboardPage() {
  const [totals, setTotals] = useState<{ income: number; expense: number; balance: number }>({ income: 0, expense: 0, balance: 0 });
  const [totalsError, setTotalsError] = useState('');
  const [range, setRange] = useState<RangeKey>('week');
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const last7Iso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toIsoDate(d);
  }, []);

  // Draft values (user is typing). Chart should NOT react until user presses "Áp dụng".
  const [fromDateText, setFromDateText] = useState<string>(isoToDdMmYyyy(last7Iso));
  const [toDateText, setToDateText] = useState<string>(isoToDdMmYyyy(todayIso));
  // Applied ISO values (chart uses these when filter is enabled)
  const [appliedFromIso, setAppliedFromIso] = useState<string>(last7Iso);
  const [appliedToIso, setAppliedToIso] = useState<string>(todayIso);
  const [useFilter, setUseFilter] = useState<boolean>(false);
  const [rangeError, setRangeError] = useState<string>('');

  const fromDateIso = useMemo(() => ddMmYyyyToIso(fromDateText), [fromDateText]);
  const toDateIso = useMemo(() => ddMmYyyyToIso(toDateText), [toDateText]);

  const [stats, setStats] = useState<{ label: string; income: number; expense: number }[]>([]);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);

  const maxValue = useMemo(() => Math.max(...stats.flatMap((s) => [s.income, s.expense]), 1), [stats]);
  const [hovered, setHovered] = useState<null | { label: string; kind: 'income' | 'expense'; value: number; x: number }>(null);

  useEffect(() => {
    let cancelled = false;
    setTotalsError('');
    void (async () => {
      try {
        const next = await dashboardService.getTotals();
        if (cancelled) return;
        setTotals(next);
      } catch (err) {
        if (cancelled) return;
        setTotalsError(err instanceof Error ? err.message : 'Không tải được tổng quan.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function refreshAll() {
      try {
        setTotalsError('');
        const nextTotals = await dashboardService.getTotals();
        setTotals(nextTotals);
      } catch (err) {
        setTotalsError(err instanceof Error ? err.message : 'Không tải được tổng quan.');
      }

      try {
        setStatsError('');
        setStatsLoading(true);
        const nextStats = !useFilter
          ? await dashboardService.getStats(range)
          : await dashboardService.getStatsBetween(appliedFromIso, appliedToIso);
        setStats(nextStats);
      } catch (err) {
        setStats([]);
        setStatsError(err instanceof Error ? err.message : 'Không tải được biểu đồ.');
      } finally {
        setStatsLoading(false);
      }
    }

    const unsub = transactionsService.subscribe(() => void refreshAll());
    return unsub;
  }, [appliedFromIso, appliedToIso, range, useFilter]);

  useEffect(() => {
    let cancelled = false;
    setStatsError('');
    setStatsLoading(true);
    void (async () => {
      try {
        const next = !useFilter
          ? await dashboardService.getStats(range)
          : await dashboardService.getStatsBetween(appliedFromIso, appliedToIso);
        if (cancelled) return;
        setStats(next);
      } catch (err) {
        if (cancelled) return;
        setStats([]);
        setStatsError(err instanceof Error ? err.message : 'Không tải được biểu đồ.');
      } finally {
        if (cancelled) return;
        setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedFromIso, appliedToIso, range, useFilter]);

  function clearErrors() {
    setRangeError('');
  }

  function resetDraftToLast7() {
    setFromDateText(isoToDdMmYyyy(last7Iso));
    setToDateText(isoToDdMmYyyy(todayIso));
  }

  function resetAppliedToLast7() {
    setAppliedFromIso(last7Iso);
    setAppliedToIso(todayIso);
  }

  function applyQuickRange(nextRange: RangeKey) {
    setUseFilter(false);
    clearErrors();
    setHovered(null);
    if (nextRange === 'today') {
      setFromDateText(isoToDdMmYyyy(todayIso));
      setToDateText(isoToDdMmYyyy(todayIso));
      setAppliedFromIso(todayIso);
      setAppliedToIso(todayIso);
      setRange('today');
      return;
    }

    // For week/month/year quick buttons we keep the draft range as last 7 days.
    resetDraftToLast7();
    resetAppliedToLast7();
    setRange(nextRange);
  }

  function onFromChange(next: string) {
    clearErrors();
    setFromDateText(next);
  }

  function onToChange(next: string) {
    clearErrors();
    setToDateText(next);
  }

  function onFromBlur() {
    clearErrors();
    const iso = ddMmYyyyToIso(fromDateText);
    if (!iso) {
      setRangeError('Từ ngày không đúng định dạng dd/mm/yyyy.');
      return;
    }
    const safeIso = iso > todayIso ? todayIso : iso;
    const safeText = isoToDdMmYyyy(safeIso);
    if (safeText === fromDateText) return;
    setFromDateText(safeText);
  }

  function onToBlur() {
    clearErrors();
    const iso = ddMmYyyyToIso(toDateText);
    if (!iso) {
      setRangeError('Đến ngày không đúng định dạng dd/mm/yyyy.');
      return;
    }
    const safeIso = iso > todayIso ? todayIso : iso;
    const safeText = isoToDdMmYyyy(safeIso);
    if (safeText === toDateText) return;
    setToDateText(safeText);
  }

  function onApplyFilter() {
    setHovered(null);
    clearErrors();
    if (!fromDateIso || !toDateIso) {
      setRangeError('Vui lòng chọn đủ Từ ngày và Đến ngày.');
      return;
    }
    if (fromDateIso > todayIso || toDateIso > todayIso) {
      setRangeError('Không thể chọn ngày trong tương lai.');
      return;
    }
    if (toDateIso < fromDateIso) {
      setRangeError('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
      return;
    }
    setAppliedFromIso(fromDateIso);
    setAppliedToIso(toDateIso);
    setUseFilter(true);
  }

  function onClearFilter() {
    setHovered(null);
    setUseFilter(false);
    clearErrors();
    resetDraftToLast7();
    resetAppliedToLast7();
  }

  function hoverXFromBar(barEl: HTMLDivElement): number {
    const parent = barEl.parentElement?.parentElement as HTMLDivElement | null;
    const parentRect = parent?.getBoundingClientRect();
    const rect = barEl.getBoundingClientRect();
    const rawX = parentRect ? rect.left - parentRect.left + rect.width / 2 : 0;
    const maxX = parentRect ? parentRect.width - 12 : rawX;
    return Math.max(12, Math.min(maxX, rawX));
  }

  function onHoverIncome(label: string, value: number, el: HTMLDivElement) {
    setHovered({ label, kind: 'income', value, x: hoverXFromBar(el) });
  }

  function onHoverExpense(label: string, value: number, el: HTMLDivElement) {
    setHovered({ label, kind: 'expense', value, x: hoverXFromBar(el) });
  }

  const tooltipText = useMemo(() => {
    if (!hovered) return null;
    const prefix = hovered.kind === 'income' ? 'Thu' : 'Chi';
    return `${prefix} ${formatMoneyVnd(hovered.value)}`;
  }, [hovered]);

  const rangeTotals = useMemo(() => {
    const income = stats.reduce((sum, s) => sum + s.income, 0);
    const expense = stats.reduce((sum, s) => sum + s.expense, 0);
    return { income, expense, net: income - expense };
  }, [stats]);

  return (
    <div className={styles.grid}>
      <div className={styles.cards}>
        <Card>
          <div className={styles.metric}>
            <div className={styles.label}>Tổng thu</div>
            <div className={styles.value}>{formatMoneyVnd(totals.income)}</div>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <div className={styles.label}>Tổng chi</div>
            <div className={styles.value}>{formatMoneyVnd(totals.expense)}</div>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <div className={styles.label}>Số dư</div>
            <div className={styles.value}>{formatMoneyVnd(totals.balance)}</div>
          </div>
        </Card>
      </div>
      {totalsError ? <div className={styles.filterError}>{totalsError}</div> : null}

      <Card title="Biểu đồ thu/chi">
        <div className={styles.chartWrap}>
          <div className={styles.rangeRow}>
            <button
              type="button"
              className={[styles.rangeBtn, range === 'today' ? styles.rangeBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => applyQuickRange('today')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className={[styles.rangeBtn, range === 'week' ? styles.rangeBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => applyQuickRange('week')}
            >
              7 ngày
            </button>
            <button
              type="button"
              className={[styles.rangeBtn, range === 'month' ? styles.rangeBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => applyQuickRange('month')}
            >
              30 ngày
            </button>
            <button
              type="button"
              className={[styles.rangeBtn, range === 'year' ? styles.rangeBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => applyQuickRange('year')}
            >
              1 năm
            </button>
          </div>

          <div className={styles.filterRow}>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Từ ngày</span>
              <input
                className={styles.filterInput}
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={fromDateText}
                maxLength={10}
                onChange={(e) => onFromChange(e.target.value)}
                onBlur={onFromBlur}
              />
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Đến ngày</span>
              <input
                className={styles.filterInput}
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={toDateText}
                maxLength={10}
                onChange={(e) => onToChange(e.target.value)}
                onBlur={onToBlur}
              />
            </label>
            <button
              type="button"
              className={[styles.rangeBtn, styles.applyBtn].join(' ')}
              onClick={onApplyFilter}
            >
              Áp dụng
            </button>
            <button
              type="button"
              className={[styles.rangeBtn, styles.clearBtn].join(' ')}
              onClick={onClearFilter}
            >
              Xoá lọc
            </button>
          </div>
          {rangeError !== '' && <div className={styles.filterError}>{rangeError}</div>}
          {statsError !== '' && <div className={styles.filterError}>{statsError}</div>}

          <div className={styles.legend}>
            <span>
              <span className={[styles.dot, styles.dotIncome].join(' ')} />
              Thu
            </span>
            <span>
              <span className={[styles.dot, styles.dotExpense].join(' ')} />
              Chi
            </span>
          </div>

          <div
            className={styles.bars}
            onMouseLeave={() => setHovered(null)}
            style={
              ({
                ['--cols' as never]: String(stats.length),
                ['--tip-left' as never]: hovered ? `${hovered.x}px` : undefined,
              } as React.CSSProperties)
            }
          >
            {tooltipText && <div className={styles.tooltip}>{tooltipText}</div>}
            {statsLoading && stats.length === 0 ? <div className={styles.tooltip}>Đang tải...</div> : null}
            {stats.map((s) => (
              <div key={s.label} className={styles.barStack}>
                {s.income > 0 ? (
                  <div
                    className={[styles.bar, styles.income, toHeightClass(s.income, maxValue)].join(' ')}
                    title={`Thu ${formatMoneyVnd(s.income)}`}
                    onMouseEnter={(e) => onHoverIncome(s.label, s.income, e.currentTarget)}
                  />
                ) : null}
                {s.expense > 0 ? (
                  <div
                    className={[styles.bar, styles.expense, toHeightClass(s.expense, maxValue)].join(' ')}
                    title={`Chi ${formatMoneyVnd(s.expense)}`}
                    onMouseEnter={(e) => onHoverExpense(s.label, s.expense, e.currentTarget)}
                  />
                ) : null}
                <div className={styles.barLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>+ Thu</div>
              <div className={[styles.summaryValue, styles.summaryIncome].join(' ')}>{formatMoneyVnd(rangeTotals.income)}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>- Chi</div>
              <div className={[styles.summaryValue, styles.summaryExpense].join(' ')}>{formatMoneyVnd(rangeTotals.expense)}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Kết quả</div>
              <div
                className={[
                  styles.summaryValue,
                  rangeTotals.net >= 0 ? styles.summaryNetPositive : styles.summaryNetNegative,
                ].join(' ')}
              >
                {rangeTotals.net >= 0 ? 'Dư' : 'Thiếu'} {formatMoneyVnd(Math.abs(rangeTotals.net))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

