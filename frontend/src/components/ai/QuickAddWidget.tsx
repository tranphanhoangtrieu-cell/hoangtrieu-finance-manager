import { useEffect, useMemo, useRef, useState } from 'react';

import styles from './QuickAddWidget.module.css';
import { nlpService } from '../../services/nlp.service';
import { transactionsService } from '../../services/transactions.service';
import { formatMoneyVnd } from '../../lib/format';
import botIcon from './icons/chat-bot.svg';
import userIcon from './icons/chat-user.svg';

function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function toIsoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

type ChatMsg = { id: string; from: 'user' | 'bot'; text: string };

function randomId() {
  return Math.random().toString(16).slice(2);
}

type PendingTx = {
  type: 'income' | 'expense';
  amount: number;
  createdAt: string;
  categoryId: string;
  categoryName: string;
  note: string;
};

type DraftTx = Omit<PendingTx, 'categoryId' | 'categoryName'> & {
  categoryId: string | null;
  categoryName: string;
};

function summarizeBatch(lines: PendingTx[]): string {
  const parts = lines.map((d, i) => {
    const typeText = d.type === 'income' ? 'thu' : 'chi';
    const dateText = isoToDdMmYyyy(d.createdAt);
    return `${i + 1}) ${typeText} ${formatMoneyVnd(d.amount)}, ngày ${dateText}, danh mục ${d.categoryName}. Ghi chú: ${d.note}.`;
  });
  const header =
    lines.length === 1 ? 'Mình sẽ tạo cho bạn 1 giao dịch:' : `Mình sẽ tạo cho bạn ${lines.length} giao dịch:`;
  const between = lines.length > 1 ? '\n\n' : '\n';
  return `${header}\n\n${parts.join(between)}`;
}

export function QuickAddWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: 'intro',
      from: 'bot',
      text: 'Mình là trợ lý nhập nhanh giao dịch. Mình sẽ giúp bạn tạo thu/chi nhanh hơn.',
    },
  ]);
  const showMenu = true;
  const [pendingLines, setPendingLines] = useState<PendingTx[] | null>(null);
  const [pickDrafts, setPickDrafts] = useState<null | {
    drafts: DraftTx[];
    categories: Array<{ id: string; name: string }>;
  }>(null);

  const canAccept = useMemo(() => !!pendingLines && pendingLines.length > 0 && !creating, [creating, pendingLines]);

  const pickCategoryTargetNote = useMemo(() => {
    if (!pickDrafts) return '';
    const idx = pickDrafts.drafts.findIndex((d) => !d.categoryId);
    if (idx < 0) return '';
    return pickDrafts.drafts[idx].note.trim();
  }, [pickDrafts]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [open, msgs.length, pendingLines, pickDrafts, pickCategoryTargetNote, error]);

  async function onSend() {
    const content = text.trim();
    if (!content || loading) return;
    setText('');
    setError('');
    setMsgs((m) => [...m, { id: randomId(), from: 'user', text: content }]);
    setError('');
    setLoading(true);
    setPendingLines(null);
    setPickDrafts(null);
    try {
      const payload = await nlpService.parse(content);
      const results = payload.results ?? [];
      const withAmount = results.filter((r) => r.amount != null && r.amount > 0);

      if (withAmount.length === 0) {
        const looksLikeCommand = /\d/.test(content) || /\b(thu|chi)\b/i.test(content);
        setMsgs((m) => [
          ...m,
          {
            id: randomId(),
            from: 'bot',
            text: looksLikeCommand
              ? 'Mình chưa nhận ra số tiền ở các dòng. Bạn thử ghi rõ số tiền (ví dụ 50k, 50000, 2tr), mỗi giao dịch cách nhau bằng dấu phẩy.'
              : 'Câu lệnh không hợp lệ. Bạn vui lòng xem mục hướng dẫn ở bên dưới.',
          },
        ]);
        return;
      }

      const drafts: DraftTx[] = withAmount.map((r) => {
        const cid = r.categoryId;
        const cname = cid ? payload.categories.find((c) => c.id === cid)?.name ?? '' : '';
        const hasCat = Boolean(cid && cname);
        return {
          type: r.type,
          amount: r.amount as number,
          createdAt: r.createdAt ?? toIsoToday(),
          note: r.note ?? content,
          categoryId: hasCat ? cid : null,
          categoryName: cname,
        };
      });

      const firstMissing = drafts.findIndex((d) => !d.categoryId);
      if (firstMissing >= 0) {
        setPickDrafts({ drafts, categories: payload.categories });
        const botText =
          drafts.length > 1
            ? 'Mình chưa nhận ra danh mục ở một hoặc nhiều dòng. Bạn chọn danh mục bên dưới, mỗi lần chọn gán cho 1 dòng còn thiếu.'
            : 'Mình chưa nhận ra danh mục. Bạn chọn 1 danh mục bên dưới.';
        setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: botText }]);
        return;
      }

      const final: PendingTx[] = drafts.map((d) => ({
        type: d.type,
        amount: d.amount,
        createdAt: d.createdAt,
        note: d.note,
        categoryId: d.categoryId as string,
        categoryName: d.categoryName,
      }));
      setPendingLines(final);
      setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: summarizeBatch(final) }]);
    } catch (err) {
      setPendingLines(null);
      setPickDrafts(null);
      setError(err instanceof Error ? err.message : 'Không phân tích được.');
      setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: 'Mình không phân tích được. Bạn thử nhập lại ngắn gọn hơn.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onPickCategory(cat: { id: string; name: string }) {
    if (!pickDrafts) return;
    setMsgs((m) => [...m, { id: randomId(), from: 'user', text: cat.name }]);

    const idx = pickDrafts.drafts.findIndex((d) => !d.categoryId);
    if (idx < 0) return;

    const nextDrafts = pickDrafts.drafts.map((d, i) =>
      i === idx ? { ...d, categoryId: cat.id, categoryName: cat.name } : d,
    );

    const stillMissing = nextDrafts.findIndex((d) => !d.categoryId);
    if (stillMissing >= 0) {
      setPickDrafts({ ...pickDrafts, drafts: nextDrafts });
      return;
    }

    const final: PendingTx[] = nextDrafts.map((d) => ({
      type: d.type,
      amount: d.amount,
      createdAt: d.createdAt,
      note: d.note,
      categoryId: d.categoryId as string,
      categoryName: d.categoryName,
    }));

    setPickDrafts(null);
    setPendingLines(final);
    setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: summarizeBatch(final) }]);
  }

  async function onAccept() {
    if (!pendingLines || pendingLines.length === 0) return;
    setError('');
    setCreating(true);
    try {
      for (const line of pendingLines) {
        await transactionsService.create({
          type: line.type,
          amount: line.amount,
          categoryId: line.categoryId,
          note: line.note,
          createdAt: line.createdAt,
        });
      }

      setText('');
      setPendingLines(null);
      const doneText =
        pendingLines.length === 1 ? 'Đã tạo giao dịch.' : `Đã tạo ${pendingLines.length} giao dịch.`;
      setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: doneText }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được giao dịch.');
    } finally {
      setCreating(false);
    }
  }

  function onDecline() {
    setPendingLines(null);
    setPickDrafts(null);
    setMsgs((m) => [...m, { id: randomId(), from: 'bot', text: 'Ok, mình dừng tại đây.' }]);
  }

  function replyBot(text: string) {
    setMsgs((m) => [...m, { id: randomId(), from: 'bot', text }]);
  }

  function onMenuAction(kind: 'how' | 'examples' | 'tips') {
    const label = kind === 'how' ? 'Cách dùng' : kind === 'examples' ? 'Ví dụ' : 'Mẹo nhập';
    setMsgs((m) => [...m, { id: randomId(), from: 'user', text: label }]);
    if (kind === 'how') {
      replyBot(
        'Bạn gửi câu có thu/chi và số tiền. Có thể nhập nhiều giao dịch trong một tin, cách nhau bằng dấu phẩy. Mình sẽ hiện bản tóm tắt để bạn Accept.',
      );
      return;
    }
    if (kind === 'examples') {
      replyBot(
        'Ví dụ một dòng: “chi 50k ăn uống” hoặc “chi 30k cafe sáng”. Ví dụ nhiều dòng: “Hôm nay chi 500k ăn uống, chi 400k buffet trưa, thu 200k bán ve chai”.',
      );
      return;
    }
    replyBot(
      'Mẹo: số tiền 50k, 2tr, 50.000. Ngày: hôm nay / hôm qua / hôm kia hoặc dd/mm/yyyy (ghi ở đầu câu áp dụng cho các dòng sau dấu phẩy). Thiếu danh mục thì bạn chọn từ danh sách.',
    );
  }

  return (
    <div className={styles.wrap}>
      {open ? (
        <div className={styles.panel}>
          <div className={styles.head}>
            <div className={styles.title}>Nhập nhanh</div>
            <button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Đóng">
              ×
            </button>
          </div>
          <div className={styles.body}>
            <div className={styles.chat}>
              <div className={styles.messages}>
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={[styles.msgRow, m.from === 'user' ? styles.msgRowUser : styles.msgRowBot].join(' ')}
                  >
                    {m.from === 'bot' ? <img className={styles.avatar} src={botIcon} alt="" /> : null}
                    <div className={[styles.bubble, m.from === 'user' ? styles.bubbleUser : styles.bubbleBot].join(' ')}>{m.text}</div>
                    {m.from === 'user' ? <img className={styles.avatar} src={userIcon} alt="" /> : null}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {showMenu ? (
                <div className={styles.menuDock}>
                  <div className={styles.menuRow}>
                    <button className={styles.chip} type="button" onClick={() => onMenuAction('how')}>
                      Cách dùng
                    </button>
                    <button className={styles.chip} type="button" onClick={() => onMenuAction('examples')}>
                      Ví dụ
                    </button>
                    <button className={styles.chip} type="button" onClick={() => onMenuAction('tips')}>
                      Mẹo nhập
                    </button>
                  </div>
                </div>
              ) : null}

              {pickDrafts ? (
                <div className={styles.menuDock}>
                  {pickCategoryTargetNote ? (
                    <div className={styles.pickCategoryHead}>
                      <div className={styles.pickCategoryTitle}>{pickCategoryTargetNote}</div>
                      <div className={styles.pickCategorySub}>Chọn danh mục</div>
                    </div>
                  ) : null}
                  <div className={styles.menuRow}>
                    {pickDrafts.categories.map((c) => (
                      <button key={c.id} className={styles.chip} type="button" onClick={() => onPickCategory(c)}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className={styles.composer}>
                <input
                  className={styles.textBox}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                />
                <button className={[styles.btn, styles.btnPrimary].join(' ')} type="button" disabled={text.trim() === '' || loading} onClick={onSend}>
                  {loading ? '...' : 'Gửi'}
                </button>
              </div>

              {error ? <div className={styles.error}>{error}</div> : null}
            </div>

            {pendingLines ? (
              <div className={styles.decisionRow}>
                <button className={[styles.btn, styles.btnPrimary].join(' ')} type="button" disabled={!canAccept} onClick={() => void onAccept()}>
                  {creating ? 'Đang tạo...' : 'Accept'}
                </button>
                <button className={styles.btn} type="button" disabled={creating} onClick={onDecline}>
                  Từ chối
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button className={styles.fab} type="button" onClick={() => setOpen((v) => !v)} aria-label="Nhập nhanh">
        ✦
      </button>
    </div>
  );
}
