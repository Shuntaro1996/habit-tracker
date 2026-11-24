export const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'] as const;

/** 端末のローカル日付を 'YYYY-MM-DD' にする（文字列のまま大小比較できる） */
export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** その日を含む週の月曜日 */
export function startOfWeek(d: Date): Date {
  const fromMonday = (d.getDay() + 6) % 7; // 月=0 … 日=6
  return addDays(d, -fromMonday);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatRange(weekStart: Date, today: Date): string {
  const end = addDays(weekStart, 6);
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const year =
    weekStart.getFullYear() !== today.getFullYear() ? `${weekStart.getFullYear()}年 ` : '';
  return `${year}${md(weekStart)} 〜 ${md(end)}`;
}

/** 0 = 今週, -1 = 先週, -2 = 2週間前 … */
export function weekLabel(offset: number): string {
  if (offset === 0) return '今週';
  if (offset === -1) return '先週';
  return `${-offset}週間前`;
}
