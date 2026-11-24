import { useCallback, useEffect, useState } from 'react';

import { emptyData, loadData, requestPersistentStorage, saveData } from './storage';
import type { AppData, Habit } from './types';

export type HabitInput = Pick<Habit, 'name' | 'color' | 'goal'>;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 習慣と記録の読み書き。変更するたびに自動で端末へ保存する */
export function useHabits() {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    requestPersistentStorage();
    loadData().then((loaded) => {
      if (!alive) return;
      setData(loaded);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) saveData(data);
  }, [data, ready]);

  const addHabit = useCallback((input: HabitInput) => {
    const habit: Habit = { ...input, id: newId(), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, habits: [...d.habits, habit] }));
  }, []);

  const updateHabit = useCallback((id: string, input: HabitInput) => {
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...input } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setData((d) => {
      const records = { ...d.records };
      delete records[id];
      return { ...d, habits: d.habits.filter((h) => h.id !== id), records };
    });
  }, []);

  /** その日の「できた」を付けたり外したりする */
  const toggle = useCallback((habitId: string, dateKey: string) => {
    setData((d) => {
      const days = { ...(d.records[habitId] ?? {}) };
      if (days[dateKey]) delete days[dateKey];
      else days[dateKey] = true;
      return { ...d, records: { ...d.records, [habitId]: days } };
    });
  }, []);

  return { ...data, ready, addHabit, updateHabit, deleteHabit, toggle };
}
