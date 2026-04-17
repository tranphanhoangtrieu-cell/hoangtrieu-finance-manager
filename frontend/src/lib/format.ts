export function formatMoneyVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

