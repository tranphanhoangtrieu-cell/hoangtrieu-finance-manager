function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYyyyMmDd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseYyyyMmDd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const dt = new Date(y, mo - 1, da);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== mo || dt.getDate() !== da) return null;
  return dt;
}

export function formatDdMmYyyy(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatMmYyyy(d: Date): string {
  return `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

