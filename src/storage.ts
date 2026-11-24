import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AppData } from './types';

const STORAGE_KEY = 'habit-tracker/v1';

export const emptyData: AppData = { version: 1, habits: [], records: {} };

/** 端末に保存したデータを読み込む（スマホ内に保存。ブラウザでは localStorage） */
export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      version: 1,
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
    };
  } catch {
    return emptyData;
  }
}

type StorageNavigator = { storage?: { persist?: () => Promise<boolean> } };

/** ブラウザ版: 保存した記録をブラウザが自動で消さないようにお願いする */
export function requestPersistentStorage(): void {
  if (Platform.OS !== 'web') return;
  const nav = (globalThis as unknown as { navigator?: StorageNavigator }).navigator;
  nav?.storage?.persist?.().catch(() => {});
}

const LAST_BACKUP_KEY = 'habit-tracker/last-backup';

/** 最後にバックアップを書き出した日時（ISO 文字列）。まだなら null */
export async function loadLastBackup(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export async function saveLastBackup(iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_BACKUP_KEY, iso);
  } catch {
    // 日付が残せなくても、バックアップ自体はできている
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 保存に失敗しても、次に記録したときにもう一度まとめて保存される
  }
}
