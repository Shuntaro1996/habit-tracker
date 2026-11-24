// 記録のバックアップ（ファイルへの書き出しと読み込み）。ブラウザ版（PWA）専用。
import type { AppData, Habit, Records } from './types';

const APP_ID = 'habit-tracker';
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
/** 習慣のIDとして受け付ける形（英数字・_・- だけ） */
const HABIT_ID = /^[A-Za-z0-9_-]{1,64}$/;
/** JavaScript で特別な意味を持つ名前は、IDとして使わせない */
const RESERVED_IDS = new Set(['__proto__', 'constructor', 'prototype']);
/** これより大きいファイルはバックアップではないとみなす（固まるのを防ぐ） */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_HABITS = 200;

/** バックアップファイルの中身 */
type BackupFile = {
  app: typeof APP_ID;
  exportedAt: string;
  data: AppData;
};

export type ExportResult = 'shared' | 'downloaded' | 'cancelled';

/** 読み込んだバックアップの中身と、確認画面に出す件数 */
export type ParsedBackup = {
  data: AppData;
  exportedAt: string | null;
  habitCount: number;
  checkCount: number;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fileName(now: Date): string {
  return `habit-tracker-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/**
 * 記録をファイルにして書き出す。
 * iPhone などファイルの共有ができる端末では共有メニュー（「ファイルに保存」など）を開き、
 * できない端末（Android の Chrome など）ではダウンロードフォルダに保存する。
 * ※ 共有メニューはタップの直後でないと開けないので、この関数の中で await より前に呼ぶ。
 */
export async function exportBackup(data: AppData): Promise<ExportResult> {
  const now = new Date();
  const backup: BackupFile = { app: APP_ID, exportedAt: now.toISOString(), data };
  const text = JSON.stringify(backup, null, 2);
  const name = fileName(now);
  const file = new File([text], name, { type: 'application/json' });

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '習慣トラッカーのバックアップ' });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // 共有に失敗したときはダウンロードで保存する
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

/** ファイルを選ぶ画面を開き、選ばれたファイルの中身を文字として返す（やめたら null） */
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    // iPhone では accept を細かく指定すると .json が選べなくなることがあるので付けない
    input.style.display = 'none';
    document.body.appendChild(input);

    const finish = (text: string | null) => {
      input.remove();
      resolve(text);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      if (file.size > MAX_FILE_BYTES) return finish('');
      file.text().then(finish, () => finish(''));
    });
    input.addEventListener('cancel', () => finish(null));
    input.click();
  });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseHabit(v: unknown): Habit | null {
  if (!isObject(v)) return null;
  const { id, name, color, goal, createdAt } = v;
  if (typeof id !== 'string' || !HABIT_ID.test(id) || RESERVED_IDS.has(id)) return null;
  if (typeof name !== 'string' || !name.trim()) return null;
  if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  if (typeof goal !== 'number' || !Number.isFinite(goal)) return null;
  return {
    id,
    name: name.trim().slice(0, 20),
    color,
    goal: Math.min(7, Math.max(1, Math.round(goal))),
    createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
  };
}

/** バックアップファイルの中身を確かめて取り出す。習慣トラッカーのファイルでなければ null */
export function parseBackup(text: string): ParsedBackup | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(json) || json.app !== APP_ID || !isObject(json.data)) return null;
  const { habits: rawHabits, records: rawRecords } = json.data;
  if (!Array.isArray(rawHabits) || rawHabits.length > MAX_HABITS) return null;

  const habits: Habit[] = [];
  for (const raw of rawHabits) {
    const habit = parseHabit(raw);
    if (!habit) return null;
    if (!habits.some((h) => h.id === habit.id)) habits.push(habit);
  }

  // 記録は「今ある習慣」「正しい日付」「true」のものだけ取り込む
  const records: Records = {};
  let checkCount = 0;
  if (isObject(rawRecords)) {
    for (const habit of habits) {
      if (!Object.prototype.hasOwnProperty.call(rawRecords, habit.id)) continue;
      const days = rawRecords[habit.id];
      if (!isObject(days)) continue;
      const clean: Record<string, true> = {};
      for (const [key, value] of Object.entries(days)) {
        if (value === true && DATE_KEY.test(key)) {
          clean[key] = true;
          checkCount++;
        }
      }
      records[habit.id] = clean;
    }
  }

  return {
    data: { version: 1, habits, records },
    exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : null,
    habitCount: habits.length,
    checkCount,
  };
}
